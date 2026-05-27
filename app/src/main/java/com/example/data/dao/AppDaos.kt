package com.example.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE email = :email")
    fun getUserByEmail(email: String): Flow<User?>

    @Query("SELECT * FROM users WHERE email = :email")
    suspend fun getUserByEmailOneShot(email: String): User?

    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)

    @Query("DELETE FROM users WHERE email = :email")
    suspend fun deleteUser(email: String)
}

@Dao
interface TeamDao {
    @Query("SELECT * FROM teams WHERE id = :id")
    fun getTeamById(id: String): Flow<Team?>

    @Query("SELECT * FROM teams WHERE id = :id")
    suspend fun getTeamByIdOneShot(id: String): Team?

    @Query("SELECT * FROM teams WHERE inviteCode = :inviteCode")
    suspend fun getTeamByInviteCode(inviteCode: String): Team?

    @Query("SELECT * FROM teams")
    fun getAllTeams(): Flow<List<Team>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTeam(team: Team)

    @Query("DELETE FROM teams WHERE id = :id")
    suspend fun deleteTeam(id: String)
}

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE teamId = :teamId ORDER BY createdAt ASC")
    fun getMessagesByTeam(teamId: String): Flow<List<Message>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: Message)

    @Query("DELETE FROM messages WHERE teamId = :teamId")
    suspend fun clearMessagesForTeam(teamId: String)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE teamId = :teamId ORDER BY createdAt DESC")
    fun getTasksByTeam(teamId: String): Flow<List<Task>>

    @Query("SELECT * FROM tasks WHERE assignedToEmail = :email ORDER BY createdAt DESC")
    fun getTasksByAssignee(email: String): Flow<List<Task>>

    @Query("SELECT * FROM tasks WHERE id = :id")
    fun getTaskById(id: String): Flow<Task?>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun getTaskByIdOneShot(id: String): Task?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: Task)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTask(id: String)
}

@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments WHERE userEmail = :email ORDER BY paidAt DESC")
    fun getPaymentsByUser(email: String): Flow<List<Payment>>

    @Query("SELECT * FROM payments ORDER BY paidAt DESC")
    fun getAllPayments(): Flow<List<Payment>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: Payment)
}

@Dao
interface NotificationDao {
    @Query("SELECT * FROM notifications WHERE userEmail = :userEmail ORDER BY createdAt DESC")
    fun getNotificationsByUser(userEmail: String): Flow<List<AppNotification>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: AppNotification)

    @Query("UPDATE notifications SET isRead = 1 WHERE id = :id")
    suspend fun markAsRead(id: String)

    @Query("UPDATE notifications SET isRead = 1 WHERE userEmail = :userEmail")
    suspend fun markAllAsRead(userEmail: String)
}
