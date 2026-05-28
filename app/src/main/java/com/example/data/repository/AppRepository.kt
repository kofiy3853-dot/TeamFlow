package com.example.data.repository

import com.example.data.dao.*
import com.example.data.model.*
import com.example.data.remote.api.TeamsService
import com.example.data.remote.api.TasksService
import com.example.data.remote.api.PaymentsService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.util.UUID

class AppRepository(
    private val userDao: UserDao,
    private val teamDao: TeamDao,
    private val messageDao: MessageDao,
    private val taskDao: TaskDao,
    private val paymentDao: PaymentDao,
    private val notificationDao: NotificationDao,
    private val authService: com.example.data.remote.api.AuthService? = null,
    private val tokenManager: com.example.data.prefs.TokenManager? = null,
    private val teamsService: TeamsService? = null,
    private val tasksService: TasksService? = null,
    private val paymentsService: PaymentsService? = null
) {
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val repositoryScope = CoroutineScope(Dispatchers.IO)

    // Auth
    suspend fun login(email: String, passwordHash: String): Result<User> {
        if (authService != null && tokenManager != null) {
            try {
                val response = authService.login(com.example.data.remote.api.LoginRequest(email, passwordHash))
                if (response.isSuccessful && response.body() != null) {
                    val authData = response.body()!!
                    tokenManager.saveToken(authData.token)
                    
                    val user = User(
                        email = authData.user.email,
                        fullname = authData.user.fullname,
                        phone = "0000000000",
                        passwordHash = passwordHash
                    )
                    userDao.insertUser(user)
                    _currentUser.value = user
                    return Result.success(user)
                }
            } catch (e: Exception) {
                // fallback to local for now
            }
        }
        
        val user = userDao.getUserByEmailOneShot(email)
        return if (user != null && user.passwordHash == passwordHash) {
            _currentUser.value = user
            Result.success(user)
        } else {
            Result.failure(Exception("Invalid email or password"))
        }
    }

    suspend fun register(fullname: String, email: String, phone: String, passwordHash: String, isSuperAdmin: Boolean = false): Result<User> {
        val existing = userDao.getUserByEmailOneShot(email)
        if (existing != null) {
            return Result.failure(Exception("User already exists with this email"))
        }
        
        if (authService != null && tokenManager != null) {
            try {
                val response = authService.register(com.example.data.remote.api.RegisterRequest(fullname, email, passwordHash, phone))
                if (response.isSuccessful && response.body() != null) {
                    val authData = response.body()!!
                    tokenManager.saveToken(authData.token)
                }
            } catch (e: Exception) {
                // ignore and register locally
            }
        }

        val defaultRole = if (isSuperAdmin) "SUPER_ADMIN" else "OWNER"
        val newUser = User(
            email = email,
            fullname = fullname,
            phone = phone,
            passwordHash = passwordHash,
            subscriptionStatus = if (isSuperAdmin) "ACTIVE" else "PENDING",
            role = defaultRole,
            avatar = "https://ui-avatars.com/api/?name=${fullname.replace(" ", "+")}&background=5C6BC0&color=fff"
        )
        userDao.insertUser(newUser)
        _currentUser.value = newUser
        return Result.success(newUser)
    }

    fun logout() {
        repositoryScope.launch { tokenManager?.clearToken() }
        _currentUser.value = null
    }

    /** Expose the stored JWT so the ViewModel can connect Socket.IO */
    suspend fun getToken(): String? = tokenManager?.tokenFlow?.first()

    /** Pull teams from the remote backend and upsert into local Room DB */
    suspend fun syncTeamsFromRemote() {
        teamsService ?: return
        try {
            val response = teamsService.getMyTeams()
            if (response.isSuccessful) {
                response.body()?.teams?.forEach { dto ->
                    val local = teamDao.getTeamByIdOneShot(dto._id)
                    val team = Team(
                        id          = dto._id,
                        name        = dto.name,
                        description = dto.description ?: "",
                        ownerEmail  = local?.ownerEmail ?: "",
                        inviteCode  = dto.inviteCode,
                        members     = dto.members.joinToString(","),
                        admins      = dto.admins.joinToString(",")
                    )
                    teamDao.insertTeam(team)
                }
            }
        } catch (e: Exception) { /* network unavailable – use local cache */ }
    }

    /** Pull tasks from the remote backend and upsert into local Room DB */
    suspend fun syncTasksFromRemote() {
        tasksService ?: return
        try {
            val response = tasksService.getMyTasks()
            if (response.isSuccessful) {
                response.body()?.forEach { dto ->
                    val task = Task(
                        id              = dto._id,
                        teamId          = dto.team?._id ?: "",
                        title           = dto.title,
                        description     = dto.description ?: "",
                        assignedToEmail = dto.assignedTo.firstOrNull()?.email ?: "",
                        assignedToName  = dto.assignedTo.firstOrNull()?.fullname ?: "",
                        priority        = dto.priority,
                        status          = dto.status,
                        dueDate         = if (dto.dueDate != null) {
                            try { java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).parse(dto.dueDate)?.time ?: 0L } catch (e: Exception) { 0L }
                        } else 0L
                    )
                    taskDao.insertTask(task)
                }
            }
        } catch (e: Exception) { /* use local cache */ }
    }

    /** Initialize a Paystack payment and return the hosted checkout URL */
    suspend fun initRemotePayment(plan: String, network: String, phone: String): Result<String> {
        paymentsService ?: return Result.failure(Exception("Payments service not configured"))
        return try {
            val response = paymentsService.initializePayment(
                com.example.data.remote.api.InitPaymentRequest(plan, network, phone)
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.authorization_url)
            } else {
                Result.failure(Exception("Payment initialization failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Refresh current user from DB
    suspend fun refreshCurrentUser() {
        _currentUser.value?.let { current ->
            val updated = userDao.getUserByEmailOneShot(current.email)
            if (updated != null) {
                _currentUser.value = updated
            }
        }
    }

    // Admin action: Suspend/Activate/Promote
    suspend fun updateUserRoleOrStatus(email: String, role: String, status: String) {
        val user = userDao.getUserByEmailOneShot(email)
        if (user != null) {
            val updated = user.copy(role = role, subscriptionStatus = status)
            userDao.insertUser(updated)
            if (_currentUser.value?.email == email) {
                _currentUser.value = updated
            }
        }
    }

    // Payments
    fun getPaymentsByUser(email: String): Flow<List<Payment>> = paymentDao.getPaymentsByUser(email)
    fun getAllPayments(): Flow<List<Payment>> = paymentDao.getAllPayments()

    suspend fun processMoMoPayment(
        userEmail: String,
        amount: Double,
        planName: String,
        provider: String,
        network: String,
        phone: String
    ): Result<Payment> {
        val user = userDao.getUserByEmailOneShot(userEmail) ?: return Result.failure(Exception("User not found"))
        
        val paymentId = UUID.randomUUID().toString()
        val reference = "TF-" + (100000 + (Math.random() * 900000).toInt())
        
        val activeUntil = System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000) // 30 Days
        
        val payment = Payment(
            id = paymentId,
            userEmail = userEmail,
            amount = amount,
            provider = provider,
            network = network,
            reference = reference,
            status = "SUCCESS",
            paidAt = System.currentTimeMillis(),
            subscriptionStart = System.currentTimeMillis(),
            subscriptionEnd = activeUntil
        )
        
        paymentDao.insertPayment(payment)
        
        val updatedUser = user.copy(
            subscriptionStatus = "ACTIVE",
            subscriptionPlan = planName,
            subscriptionExpiry = activeUntil
        )
        userDao.insertUser(updatedUser)
        
        if (_currentUser.value?.email == userEmail) {
            _currentUser.value = updatedUser
        }
        
        // Push notification
        val notificationId = UUID.randomUUID().toString()
        notificationDao.insertNotification(
            AppNotification(
                id = notificationId,
                userEmail = userEmail,
                title = "Payment Successful 🎉",
                message = "Your GHS $amount payment for TeamFlow $planName Plan was verified. Access granted to workspace!",
                type = "SUCCESS"
            )
        )
        
        return Result.success(payment)
    }

    // Teams
    fun getAllTeamsFlow(): Flow<List<Team>> = teamDao.getAllTeams()
    fun getTeamFlow(teamId: String): Flow<Team?> = teamDao.getTeamById(teamId)
    suspend fun getTeamOneShot(teamId: String): Team? = teamDao.getTeamByIdOneShot(teamId)

    suspend fun createTeam(name: String, description: String, ownerEmail: String): Result<Team> {
        val teamId = UUID.randomUUID().toString()
        val inviteCode = "TF-" + (1000 + (Math.random() * 9000).toInt())
        val team = Team(
            id = teamId,
            name = name,
            description = description,
            ownerEmail = ownerEmail,
            inviteCode = inviteCode,
            members = ownerEmail,
            admins = ownerEmail
        )
        teamDao.insertTeam(team)

        // Add to user
        val user = userDao.getUserByEmailOneShot(ownerEmail)
        if (user != null) {
            val userTeamsList = if (user.joinedTeams.isBlank()) mutableListOf() else user.joinedTeams.split(",").toMutableList()
            if (!userTeamsList.contains(teamId)) {
                userTeamsList.add(teamId)
            }
            val updatedUser = user.copy(joinedTeams = userTeamsList.joinToString(","))
            userDao.insertUser(updatedUser)
            if (_currentUser.value?.email == ownerEmail) {
                _currentUser.value = updatedUser
            }
        }

        // Add a notification
        notificationDao.insertNotification(
            AppNotification(
                id = UUID.randomUUID().toString(),
                userEmail = ownerEmail,
                title = "Team Created 🚀",
                message = "You created team '${name}'. Share the invite code: $inviteCode with your colleague to collaborate.",
                type = "SUCCESS"
            )
        )

        return Result.success(team)
    }

    suspend fun joinTeam(inviteCode: String, userEmail: String): Result<Team> {
        val team = teamDao.getTeamByInviteCode(inviteCode)
            ?: return Result.failure(Exception("Team with this invite code was not found"))

        val membersList = if (team.members.isBlank()) mutableListOf() else team.members.split(",").toMutableList()
        if (membersList.contains(userEmail)) {
            return Result.failure(Exception("You are already a member of this team"))
        }

        membersList.add(userEmail)
        val updatedTeam = team.copy(members = membersList.joinToString(","))
        teamDao.insertTeam(updatedTeam)

        // Update user
        val user = userDao.getUserByEmailOneShot(userEmail)
        if (user != null) {
            val userTeamsList = if (user.joinedTeams.isBlank()) mutableListOf() else user.joinedTeams.split(",").toMutableList()
            if (!userTeamsList.contains(team.id)) {
                userTeamsList.add(team.id)
            }
            val updatedUser = user.copy(joinedTeams = userTeamsList.joinToString(","))
            userDao.insertUser(updatedUser)
            if (_currentUser.value?.email == userEmail) {
                _currentUser.value = updatedUser
            }
        }

        // Broadcast notification to user
        notificationDao.insertNotification(
            AppNotification(
                id = UUID.randomUUID().toString(),
                userEmail = userEmail,
                title = "Joined Team! 🤝",
                message = "Successfully joined team '${team.name}'. Explore tasks and send messages of your team workspace.",
                type = "SUCCESS"
            )
        )

        // Notify creator
        notificationDao.insertNotification(
            AppNotification(
                id = UUID.randomUUID().toString(),
                userEmail = team.ownerEmail,
                title = "New Member Joined!",
                message = "$userEmail joined your team '${team.name}'. Let's collaborate!",
                type = "INFO"
            )
        )

        return Result.success(updatedTeam)
    }

    suspend fun promoteMember(teamId: String, memberEmail: String): Boolean {
        val team = teamDao.getTeamByIdOneShot(teamId) ?: return false
        val adminList = if (team.admins.isBlank()) mutableListOf() else team.admins.split(",").toMutableList()
        if (!adminList.contains(memberEmail)) {
            adminList.add(memberEmail)
            val updated = team.copy(admins = adminList.joinToString(","))
            teamDao.insertTeam(updated)
            return true
        }
        return false
    }

    suspend fun removeMember(teamId: String, memberEmail: String): Boolean {
        val team = teamDao.getTeamByIdOneShot(teamId) ?: return false
        val membersList = if (team.members.isBlank()) mutableListOf() else team.members.split(",").toMutableList()
        val adminsList = if (team.admins.isBlank()) mutableListOf() else team.admins.split(",").toMutableList()
        
        if (membersList.contains(memberEmail) && team.ownerEmail != memberEmail) {
            membersList.remove(memberEmail)
            adminsList.remove(memberEmail)
            val updated = team.copy(members = membersList.joinToString(","), admins = adminsList.joinToString(","))
            teamDao.insertTeam(updated)

            // Update user's records
            val user = userDao.getUserByEmailOneShot(memberEmail)
            if (user != null) {
                val userTeamsList = if (user.joinedTeams.isBlank()) mutableListOf() else user.joinedTeams.split(",").toMutableList()
                userTeamsList.remove(teamId)
                userDao.insertUser(user.copy(joinedTeams = userTeamsList.joinToString(",")))
            }
            return true
        }
        return false
    }

    // Real-time Chat Simulator
    fun getMessagesForTeam(teamId: String): Flow<List<Message>> = messageDao.getMessagesByTeam(teamId)

    // Used to simulate Typing indicator
    private val _typingUsers = MutableStateFlow<Map<String, String>>(emptyMap()) // teamId -> typingText
    val typingUsers: StateFlow<Map<String, String>> = _typingUsers.asStateFlow()

    suspend fun sendMessage(teamId: String, senderEmail: String, senderName: String, content: String): Result<Message> {
        val msgId = UUID.randomUUID().toString()
        val message = Message(
            id = msgId,
            teamId = teamId,
            senderEmail = senderEmail,
            senderName = senderName,
            content = content
        )
        messageDao.insertMessage(message)

        // Simulate Socket.IO Auto Reply after a small delay
        simulateTeamInteraction(teamId, content)

        return Result.success(message)
    }

    private fun simulateTeamInteraction(teamId: String, userMessage: String) {
        repositoryScope.launch {
            // Wait 1.5 seconds, then declare collaborator is "typing"
            delay(1500)
            
            val activeBots = listOf(
                Pair("Sarah Mensah", "sarah@teamflow.com"),
                Pair("Kojo Asante", "kojo@teamflow.com"),
                Pair("Abishola Alao", "abishola@teamflow.com")
            )
            val randomBot = activeBots.random()
            
            val typingText = "${randomBot.first} is typing..."
            _typingUsers.value = _typingUsers.value + (teamId to typingText)
            
            delay(2000) // typing duration
            
            // clear typing indicator
            _typingUsers.value = _typingUsers.value - teamId
            
            // Generate response
            val replyText = generateBotReply(userMessage, randomBot.first)
            
            val replyId = UUID.randomUUID().toString()
            val replyMessage = Message(
                id = replyId,
                teamId = teamId,
                senderEmail = randomBot.second,
                senderName = randomBot.first,
                content = replyText
            )
            messageDao.insertMessage(replyMessage)
        }
    }

    private fun generateBotReply(userMsg: String, botName: String): String {
        val query = userMsg.lowercase()
        return when {
            query.contains("hello") || query.contains("hi") || query.contains("hey") -> {
                "Hey there! Ready to power up our collaboration today? Gearing up for some sprint tasks!"
            }
            query.contains("task") || query.contains("board") || query.contains("todo") -> {
                "Awesome! I saw the task board. I can take over the UX reviews if nobody is assigned yet. Let me know!"
            }
            query.contains("meeting") || query.contains("call") || query.contains("jitsi") -> {
                "Perfect, let's jump into the Jitsi channel. Screen sharing is ready on my side."
            }
            query.contains("pay") || query.contains("subscription") || query.contains("money") || query.contains("momo") -> {
                "TeamFlow billing setup with Mobile Money was extremely smooth. I got configured on MTN MoMo in a couple of minutes."
            }
            else -> {
                "Thanks for the update! Let's stay aligned. I'll document this in our Notion board to keep track."
            }
        }
    }

    // Tasks
    fun getTasksByTeam(teamId: String): Flow<List<Task>> = taskDao.getTasksByTeam(teamId)
    fun getTasksByAssignee(email: String): Flow<List<Task>> = taskDao.getTasksByAssignee(email)
    fun getTaskById(id: String): Flow<Task?> = taskDao.getTaskById(id)

    suspend fun createTask(
        teamId: String,
        title: String,
        description: String,
        assignedEmail: String,
        assignedName: String,
        priority: String,
        status: String = "TODO",
        dueDate: Long = 0
    ): Result<Task> {
        val taskId = UUID.randomUUID().toString()
        val activityLogs = """[{"user":"System","action":"Task Created","time":${System.currentTimeMillis()}}]"""
        val task = Task(
            id = taskId,
            teamId = teamId,
            title = title,
            description = description,
            assignedToEmail = assignedEmail,
            assignedToName = assignedName,
            priority = priority,
            status = status,
            dueDate = if (dueDate == 0L) System.currentTimeMillis() + 3 * 24 * 3600 * 1000L else dueDate,
            commentsJson = "[]",
            activityLogsJson = activityLogs
        )
        taskDao.insertTask(task)

        // Notify assignee
        if (assignedEmail.isNotBlank()) {
            notificationDao.insertNotification(
                AppNotification(
                    id = UUID.randomUUID().toString(),
                    userEmail = assignedEmail,
                    title = "New Task Assigned 🚀",
                    message = "You have been assigned to task '${title}'. Priority: $priority.",
                    type = "INFO"
                )
            )
        }

        return Result.success(task)
    }

    suspend fun updateTaskStatus(taskId: String, newStatus: String, updaterName: String) {
        val task = taskDao.getTaskByIdOneShot(taskId)
        if (task != null) {
            val newLogs = task.activityLogsJson.replace("]", ",{\"user\":\"$updaterName\",\"action\":\"Moved to $newStatus\",\"time\":${System.currentTimeMillis()}}]")
            val updated = task.copy(status = newStatus, activityLogsJson = newLogs)
            taskDao.insertTask(updated)
        }
    }

    suspend fun addTaskComment(taskId: String, commenterName: String, commentContent: String) {
        val task = taskDao.getTaskByIdOneShot(taskId)
        if (task != null) {
            val newComment = "{\"author\":\"$commenterName\",\"content\":\"$commentContent\",\"time\":${System.currentTimeMillis()}}"
            val currentComments = task.commentsJson
            val updatedComments = if (currentComments == "[]" || currentComments.isBlank()) {
                "[$newComment]"
            } else {
                currentComments.replace("]", ",$newComment]")
            }
            val updatedTask = task.copy(commentsJson = updatedComments)
            taskDao.insertTask(updatedTask)
        }
    }

    // Notifications
    fun getNotificationsFlow(userEmail: String): Flow<List<AppNotification>> =
        notificationDao.getNotificationsByUser(userEmail)

    suspend fun markNotificationAsRead(id: String) {
        notificationDao.markAsRead(id)
    }

    suspend fun markAllNotificationsAsRead(userEmail: String) {
        notificationDao.markAllAsRead(userEmail)
    }

    suspend fun triggerCustomNotification(email: String, title: String, message: String, type: String) {
        notificationDao.insertNotification(
            AppNotification(
                id = UUID.randomUUID().toString(),
                userEmail = email,
                title = title,
                message = message,
                type = type
            )
        )
    }

    // Superadmin: retrieve all users
    fun getAllUsersFlow(): Flow<List<User>> = userDao.getAllUsers()
}
