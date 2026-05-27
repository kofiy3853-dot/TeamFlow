package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.AppViewModel
import com.example.ui.viewmodel.UiState
import com.example.ui.viewmodel.MoMoPaymentState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class AppScreen {
    AUTH, PAYMENT, WORKSPACE
}

enum class ActiveTab {
    DASHBOARD, TEAMS, CHAT, TASKS, PAYMENTS, ADMIN
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun MainAppContainer(viewModel: AppViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val paymentState by viewModel.paymentState.collectAsState()

    // Determine target app screen state dynamically
    val currentScreen = when {
        currentUser == null -> AppScreen.AUTH
        currentUser?.subscriptionStatus != "ACTIVE" && currentUser?.role != "SUPER_ADMIN" -> AppScreen.PAYMENT
        else -> AppScreen.WORKSPACE
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        AnimatedContent(
            targetState = currentScreen,
            transitionSpec = {
                fadeIn() togetherWith fadeOut()
            },
            label = "ScreenTransition"
        ) { target ->
            when (target) {
                AppScreen.AUTH -> AuthView(viewModel)
                AppScreen.PAYMENT -> PaymentPlanView(viewModel)
                AppScreen.WORKSPACE -> WorkspaceView(viewModel)
            }
        }
    }
}

// ----------------------------------------------------
// 1. AUTHENTICATION VIEW
// ----------------------------------------------------
@Composable
fun AuthView(viewModel: AppViewModel) {
    var isRegisterMode by remember { mutableStateOf(false) }
    var fullname by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isSuperAdminSetup by remember { mutableStateOf(false) }

    val loginState by viewModel.loginState.collectAsState()
    val registerState by viewModel.registerState.collectAsState()

    // Monitor response to clear state as needed
    LaunchedEffect(isRegisterMode) {
        viewModel.resetAuthState()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .testTag("auth_card"),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(8.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Brand Header
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(
                            Brush.linearGradient(
                                listOf(WorkspacePrimary, WorkspaceSecondary)
                            ),
                            CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Cyclone,
                        contentDescription = "TeamFlow logo",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "TeamFlow",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "High-Productivity Enterprise Workspace",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Error UI
                val errorMessage = when {
                    loginState is UiState.Error -> (loginState as UiState.Error).message
                    registerState is UiState.Error -> (registerState as UiState.Error).message
                    else -> null
                }
                if (errorMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = TeamFlowError.copy(alpha = 0.12f)
                        ),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = errorMessage,
                            color = TeamFlowError,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                // Input fields
                if (isRegisterMode) {
                    OutlinedTextField(
                        value = fullname,
                        onValueChange = { fullname = it },
                        label = { Text("Full Name") },
                        leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth().testTag("auth_fullname"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email Address") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth().testTag("auth_email"),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )
                Spacer(modifier = Modifier.height(8.dp))

                if (isRegisterMode) {
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Mobile Money Number") },
                        leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth().testTag("auth_phone"),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        placeholder = { Text("e.g. 055xxxxxxx") }
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth().testTag("auth_password"),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                )

                if (isRegisterMode) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = isSuperAdminSetup,
                            onCheckedChange = { isSuperAdminSetup = it },
                            modifier = Modifier.testTag("admin_checkbox")
                        )
                        Text(
                            text = "Register as Super Admin (Bypass Subscription Flow)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            modifier = Modifier.clickable { isSuperAdminSetup = !isSuperAdminSetup }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Actions buttons
                val isLoading = loginState is UiState.Loading || registerState is UiState.Loading
                if (isLoading) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                } else {
                    Button(
                        onClick = {
                            if (isRegisterMode) {
                                if (fullname.isNotBlank() && email.isNotBlank() && phone.isNotBlank() && password.isNotBlank()) {
                                    viewModel.register(fullname, email, phone, password, isSuperAdminSetup)
                                }
                            } else {
                                if (email.isNotBlank() && password.isNotBlank()) {
                                    viewModel.login(email, password)
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("auth_submit_button"),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = if (isRegisterMode) "Create GHS MoMo Workspace" else "Login to TeamFlow",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = if (isRegisterMode) "Already have an account? Login" else "Don't have an account? Sign up with Mobile Money",
                        modifier = Modifier
                            .clickable { isRegisterMode = !isRegisterMode }
                            .testTag("auth_mode_toggle"),
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                    )
                }
            }
        }
    }
}

// ----------------------------------------------------
// 2. PAYMENT PLAN VIEW (SaaS Registration flow)
// ----------------------------------------------------
@Composable
fun PaymentPlanView(viewModel: AppViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val paymentState by viewModel.paymentState.collectAsState()

    var selectedPlan by remember { mutableStateOf("Pro") }
    var selectedNetwork by remember { mutableStateOf("MTN") } // MTN, Telecel, AirtelTigo
    var walletNumber by remember { mutableStateOf(currentUser?.phone ?: "") }

    val focusManager = LocalFocusManager.current

    val plans = listOf(
        Triple("Basic", 20.0, "For small teams starting off. All core chat and tasks."),
        Triple("Pro", 50.0, "Most popular. Continuous collaboration, infinite boards, bot integration."),
        Triple("Enterprise", 150.0, "For massive departments. 100+ members, dedicated metrics dashboard.")
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(28.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { viewModel.logout() }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Welcome, ${currentUser?.fullname ?: ""}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Activate Your Workspace Subscription",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Complete your GHS monthly subscription below to instantly unlock cooperative boards.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Loop and show plans
            plans.forEach { (name, amount, desc) ->
                val isSelected = selectedPlan == name
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clickable { selectedPlan = name },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)
                        else MaterialTheme.colorScheme.surface
                    ),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = isSelected,
                            onClick = { selectedPlan = name }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                name + " Monthly Plan",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                desc,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                        Text(
                            text = "GHS ${amount.toInt()}",
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Ghana Mobile Money Platform Checkout",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.DarkGray
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "Select Network Operator",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("MTN MoMo" to "MTN", "Telecel Cash" to "Telecel", "AirtelTigo Money" to "AirtelTigo").forEach { (label, networkCode) ->
                            val isSelected = selectedNetwork == networkCode
                            Button(
                                onClick = { selectedNetwork = networkCode },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                    contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
                            ) {
                                Text(label, style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, fontWeight = FontWeight.SemiBold))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = walletNumber,
                        onValueChange = { walletNumber = it },
                        label = { Text("Mobile Money Wallet Number") },
                        placeholder = { Text("e.g. 0558123456") },
                        leadingIcon = { Icon(Icons.Default.PhoneAndroid, "MoMo wallet icon") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth().testTag("payment_momo_phone"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "🔒 Never enter your GHS MoMo PIN on this screen. A secure USSD prompt will be sent to your SIM toolkit directly.",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    val selectedPlanAmount = plans.first { it.first == selectedPlan }.second
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            if (walletNumber.length >= 9) {
                                viewModel.initiateMoMoPayment(
                                    planName = selectedPlan,
                                    amount = selectedPlanAmount,
                                    provider = "Paystack Hubtel Checkout",
                                    network = selectedNetwork,
                                    phone = walletNumber
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = WorkspacePrimary),
                        modifier = Modifier.fillMaxWidth().height(48.dp).testTag("payment_initialize_btn"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Initialize Subscription Prompt: GHS ${selectedPlanAmount.toInt()}", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
        }

        // USSD Sim toolkit Dialog simulator!
        if (paymentState.status == "PENDING_PIN") {
            USSDDialogOverlay(
                paymentState = paymentState,
                onPinSubmit = { pinCode ->
                    viewModel.submitMoMoPin(pinCode)
                },
                onCancel = {
                    viewModel.cancelPayment()
                }
            )
        }

        // Processing screen
        if (paymentState.status == "VERIFYING") {
            Dialog(onDismissRequest = {}) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.padding(24.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Awaiting PIN secure submission...",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Simulating Hubtel background endpoint validation checks and secure SIM prompt callback webhooks on $selectedNetwork.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun USSDDialogOverlay(
    paymentState: MoMoPaymentState,
    onPinSubmit: (String) -> Unit,
    onCancel: () -> Unit
) {
    var promptPin by remember { mutableStateOf("") }
    var pinError by remember { mutableStateOf("") }

    Dialog(onDismissRequest = {}) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)), // Slate 100 looks like system popups
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(2.dp, Color.LightGray, RoundedCornerShape(14.dp))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Toolkit Title
                Text(
                    text = "SIM ToolKit Prompt: ${paymentState.network}",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                    color = Color.DarkGray
                )
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Confirm payment of GHS ${paymentState.amount.toInt()} for TeamFlow ${paymentState.planName} SaaS workspace setup.\n" +
                            "Enter your 4-digit secret wallet PIN directly below to authorized securely.",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp, lineHeight = 16.sp),
                    textAlign = TextAlign.Center,
                    color = Color.Black
                )
                Spacer(modifier = Modifier.height(16.dp))

                // Custom virtual screen displaying mask
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    border = BorderStroke(1.dp, Color.Gray),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = if (promptPin.isEmpty()) "• • • •" else "• ".repeat(promptPin.length),
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                            color = if (promptPin.isEmpty()) Color.LightGray else Color.Black
                        )
                    }
                }

                if (paymentState.errorMessage.isNotBlank() || pinError.isNotBlank()) {
                    Text(
                        text = if (pinError.isNotBlank()) pinError else paymentState.errorMessage,
                        color = TeamFlowError,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Numerical virtual keypad
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val keys = listOf(
                        listOf("1", "2", "3"),
                        listOf("4", "5", "6"),
                        listOf("7", "8", "9"),
                        listOf("Clear", "0", "OK")
                    )

                    keys.forEach { row ->
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            row.forEach { char ->
                                Button(
                                    onClick = {
                                        when (char) {
                                            "Clear" -> {
                                                promptPin = ""
                                                pinError = ""
                                            }
                                            "OK" -> {
                                                if (promptPin.length < 4) {
                                                    pinError = "PIN must be 4 digits"
                                                } else {
                                                    onPinSubmit(promptPin)
                                                }
                                            }
                                            else -> {
                                                if (promptPin.length < 4) {
                                                    promptPin += char
                                                }
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (char == "OK") WorkspaceTertiary else Color.White,
                                        contentColor = if (char == "OK") Color.White else Color.Black
                                    ),
                                    shape = RoundedCornerShape(4.dp),
                                    modifier = Modifier.weight(1f),
                                    elevation = ButtonDefaults.buttonElevation(2.dp),
                                    contentPadding = PaddingValues(8.dp)
                                ) {
                                    Text(
                                        text = char,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = onCancel) {
                    Text("Cancel Transaction", color = TeamFlowError, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
        }
    }
}

// ----------------------------------------------------
// 3. WORKSPACE CONTAINER VIEW
// ----------------------------------------------------
@Composable
fun WorkspaceView(viewModel: AppViewModel) {
    var activeTab by remember { mutableStateOf(ActiveTab.DASHBOARD) }
    val currentUser by viewModel.currentUser.collectAsState()

    // Control visibility of team creation/join drawer
    var showTeamActionDialog by remember { mutableStateOf(false) }

    // Floating action button triggers
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            WorkspaceTopBar(
                viewModel = viewModel,
                activeTab = activeTab,
                onTeamActionTriggered = { showTeamActionDialog = true }
            )
        },
        bottomBar = {
            WorkspaceBottomNavigation(
                activeTab = activeTab,
                onTabSelected = { activeTab = it },
                userRole = currentUser?.role ?: "MEMBER"
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (activeTab) {
                ActiveTab.DASHBOARD -> DashboardTab(viewModel)
                ActiveTab.TEAMS -> TeamsManagementTab(viewModel)
                ActiveTab.CHAT -> ChatTab(viewModel)
                ActiveTab.TASKS -> TasksBoardTab(viewModel)
                ActiveTab.PAYMENTS -> PaymentsHistoryTab(viewModel)
                ActiveTab.ADMIN -> SuperAdminPanelTab(viewModel)
            }
        }
    }

    if (showTeamActionDialog) {
        TeamActionDialog(
            viewModel = viewModel,
            onDismiss = { showTeamActionDialog = false }
        )
    }
}

@Composable
fun WorkspaceTopBar(
    viewModel: AppViewModel,
    activeTab: ActiveTab,
    onTeamActionTriggered: () -> Unit
) {
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val userJoinedTeams by viewModel.userJoinedTeams.collectAsState()
    val notifications by viewModel.notifications.collectAsState()

    var showNotificationsDropdown by remember { mutableStateOf(false) }
    var showTeamsDropdown by remember { mutableStateOf(false) }

    Surface(
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.6f),
                shape = RoundedCornerShape(0.dp)
            ),
        tonalElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .statusBarsPadding()
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left Team Switcher
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clickable { showTeamsDropdown = true }
                    .testTag("team_selector_trigger")
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .background(
                            Color(selectedTeam?.avatarBgColor ?: 0xFF5C6BC0.toInt()),
                            RoundedCornerShape(6.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = selectedTeam?.name?.take(2)?.uppercase() ?: "TF",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = selectedTeam?.name ?: "No Selected Team",
                        style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.widthIn(max = 140.dp)
                    )
                    Text(
                        text = "Toggle workspaces ▾",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                    )
                }
            }

            // Screen name
            Text(
                text = activeTab.name,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center
            )

            // Right icons (Notifications, Logout)
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                val unreadNotifications = notifications.filter { !it.isRead }
                Box {
                    IconButton(
                        onClick = { showNotificationsDropdown = true },
                        modifier = Modifier.testTag("notification_bell_btn")
                    ) {
                        BadgedBox(
                            badge = {
                                if (unreadNotifications.isNotEmpty()) {
                                    Badge { Text(unreadNotifications.size.toString()) }
                                }
                            }
                        ) {
                            Icon(
                                imageVector = if (unreadNotifications.isNotEmpty()) Icons.Default.NotificationsActive else Icons.Default.Notifications,
                                contentDescription = "Alerts"
                            )
                        }
                    }

                    // Dropdown notifications
                    DropdownMenu(
                        expanded = showNotificationsDropdown,
                        onDismissRequest = { showNotificationsDropdown = false },
                        modifier = Modifier.width(280.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Notifications", fontWeight = FontWeight.Bold)
                            TextButton(onClick = { viewModel.markAllNotificationsRead() }) {
                                Text("Clear All", fontSize = 11.sp)
                            }
                        }
                        Divider()
                        if (notifications.isEmpty()) {
                            DropdownMenuItem(
                                text = { Text("No notifications yet.") },
                                onClick = { showNotificationsDropdown = false }
                            )
                        } else {
                            notifications.take(5).forEach { isNotif ->
                                val notifColor = when (isNotif.type) {
                                    "SUCCESS" -> TeamFlowSuccess
                                    "WARNING" -> TeamFlowWarning
                                    "ERROR" -> TeamFlowError
                                    else -> TeamFlowInfo
                                }
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(8.dp)
                                                        .background(notifColor, CircleShape)
                                                )
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text(isNotif.title, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                            }
                                            Text(isNotif.message, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                        }
                                    },
                                    onClick = {
                                        viewModel.markNotificationRead(isNotif.id)
                                        showNotificationsDropdown = false
                                    }
                                )
                            }
                        }
                    }
                }

                // Logout Action
                IconButton(onClick = { viewModel.logout() }) {
                    Icon(Icons.Default.Logout, contentDescription = "Log Out")
                }
            }
        }

        // Teams Dropdown
        DropdownMenu(
            expanded = showTeamsDropdown,
            onDismissRequest = { showTeamsDropdown = false },
            modifier = Modifier.width(240.dp)
        ) {
            Text(
                text = "My Workspaces",
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                fontSize = 12.sp,
                color = Color.Gray
            )
            Divider()
            userJoinedTeams.forEach { workspace ->
                DropdownMenuItem(
                    leadingIcon = {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .background(Color(workspace.avatarBgColor), RoundedCornerShape(4.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(workspace.name.take(1).uppercase(), color = Color.White, fontSize = 11.sp)
                        }
                    },
                    text = { Text(workspace.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    onClick = {
                        viewModel.selectTeam(workspace.id)
                        showTeamsDropdown = false
                    }
                )
            }
            Divider()
            DropdownMenuItem(
                leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Create or Join Team", fontWeight = FontWeight.Bold) },
                onClick = {
                    showTeamsDropdown = false
                    onTeamActionTriggered()
                }
            )
        }
    }
}

@Composable
fun WorkspaceBottomNavigation(
    activeTab: ActiveTab,
    onTabSelected: (ActiveTab) -> Unit,
    userRole: String
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.6f),
                shape = RoundedCornerShape(0.dp)
            )
    ) {
        val tabs = mutableListOf(
            Triple(ActiveTab.DASHBOARD, "Dashboard", Icons.Default.Dashboard),
            Triple(ActiveTab.CHAT, "Chat", Icons.Default.Chat),
            Triple(ActiveTab.TASKS, "Tasks", Icons.Default.LibraryAddCheck),
            Triple(ActiveTab.PAYMENTS, "Billing", Icons.Default.Payment)
        )

        // Only add super admin tab for supervisors
        if (userRole == "SUPER_ADMIN") {
            tabs.add(Triple(ActiveTab.ADMIN, "Super Admin", Icons.Default.AdminPanelSettings))
        } else {
            // Put managing tab instead
            tabs.add(2, Triple(ActiveTab.TEAMS, "Group", Icons.Default.Group))
        }

        tabs.forEach { (tab, label, icon) ->
            val isSelected = activeTab == tab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = { 
                    Icon(
                        icon, 
                        contentDescription = label,
                        modifier = Modifier.size(22.dp)
                    ) 
                },
                label = { 
                    Text(
                        text = label, 
                        fontSize = 10.sp, 
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    ) 
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Color.White,
                    unselectedIconColor = Color(0xFF94A3B8),
                    selectedTextColor = WorkspacePrimary,
                    unselectedTextColor = Color(0xFF94A3B8),
                    indicatorColor = WorkspacePrimary
                ),
                modifier = Modifier.testTag("nav_tab_${tab.name.lowercase()}")
            )
        }
    }
}

// ----------------------------------------------------
// 4. DIALOG: CREATE OR JOIN TEAM
// ----------------------------------------------------
@Composable
fun TeamActionDialog(viewModel: AppViewModel, onDismiss: () -> Unit) {
    var isCreateMode by remember { mutableStateOf(true) }

    // Creation Fields
    var teamName by remember { mutableStateOf("") }
    var teamDescription by remember { mutableStateOf("") }

    // Joining fields
    var teamInviteCode by remember { mutableStateOf("") }
    var joinMessage by remember { mutableStateOf("") }
    var isSuccessJoin by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.padding(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                TabRow(selectedTabIndex = if (isCreateMode) 0 else 1) {
                    Tab(selected = isCreateMode, onClick = { isCreateMode = true }) {
                        Text("Create Workspace", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                    }
                    Tab(selected = !isCreateMode, onClick = { isCreateMode = false }) {
                        Text("Join via Code", modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (isCreateMode) {
                    OutlinedTextField(
                        value = teamName,
                        onValueChange = { teamName = it },
                        label = { Text("Workspace / Team Name") },
                        modifier = Modifier.fillMaxWidth().testTag("dialog_team_name"),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = teamDescription,
                        onValueChange = { teamDescription = it },
                        label = { Text("Brief Purpose / Description") },
                        modifier = Modifier.fillMaxWidth().height(90.dp).testTag("dialog_team_desc"),
                        maxLines = 3
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = {
                            if (teamName.isNotBlank()) {
                                viewModel.createTeam(teamName, teamDescription)
                                onDismiss()
                            }
                        },
                        modifier = Modifier.fillMaxWidth().testTag("dialog_team_submit_btn")
                    ) {
                        Text("Spin Up TeamFlow Space", fontWeight = FontWeight.Bold)
                    }
                } else {
                    OutlinedTextField(
                        value = teamInviteCode,
                        onValueChange = { teamInviteCode = it },
                        label = { Text("6-Digit Team Invite Code") },
                        placeholder = { Text("e.g. TF-7841") },
                        modifier = Modifier.fillMaxWidth().testTag("dialog_join_code"),
                        singleLine = true
                    )
                    if (joinMessage.isNotBlank()) {
                        Text(
                            text = joinMessage,
                            color = if (isSuccessJoin) TeamFlowSuccess else TeamFlowError,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = {
                            if (teamInviteCode.isNotBlank()) {
                                viewModel.joinTeam(teamInviteCode) { ok, msg ->
                                    isSuccessJoin = ok
                                    joinMessage = msg
                                    if (ok) {
                                        onDismiss()
                                    }
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().testTag("dialog_join_submit_btn")
                    ) {
                        Text("Verify & Enter Workspace", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// --------------------------------//
// VERTICAL SCROLL HELPER
// --------------------------------//
@Composable
fun rememberScrollState(): androidx.compose.foundation.ScrollState {
    return androidx.compose.foundation.rememberScrollState()
}

// ----------------------------------------------------
// TAB 1: WORKSPACE DASHBOARD
// ----------------------------------------------------
@Composable
fun DashboardTab(viewModel: AppViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val activeTasks by viewModel.activeTasks.collectAsState()
    val userAssignedTasks by viewModel.userAssignedTasks.collectAsState()

    val pendingTasks = activeTasks.filter { it.status != "DONE" }
    val completedCount = activeTasks.size - pendingTasks.size

    val sdf = SimpleDateFormat("MMM d, yyyy", Locale.getDefault())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Welcome segment styled in minimalist warm white layout with thin borders
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(50.dp)
                        ) {
                            Text(
                                text = "ACTIVE PRO WORKSPACE",
                                color = Color(0xFF15803D),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                            )
                        }
                        Text(
                            text = "Renews: ${sdf.format(Date(currentUser?.subscriptionExpiry ?: 0))}",
                            color = Color.Gray,
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = 11.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Hello, ${currentUser?.fullname ?: ""}!",
                        color = MaterialTheme.colorScheme.onBackground,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Your workspace has unlimited team collaboration boards, secure chats, customizable task milestones, and real-time payment tracking configured.",
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 12.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Grid Metrics
        Text("Active Workspace Stats", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricCard(
                title = "My Assigned",
                value = userAssignedTasks.filter { it.status != "DONE" }.size.toString(),
                subtitle = "Milestones to complete",
                color = WorkspacePrimary,
                modifier = Modifier.weight(1f)
            )
            MetricCard(
                title = "Completed",
                value = completedCount.toString(),
                subtitle = "Tasks finalized",
                color = TeamFlowSuccess,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Calendar Highlights
        Text("Sprint Deadlines Calendar", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        if (pendingTasks.isEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "No pending deadlines in standard pipeline. Excellent job!",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            pendingTasks.take(3).forEach { task ->
                val taskColor = when (task.priority) {
                    "URGENT" -> TeamFlowError
                    "HIGH" -> TeamFlowWarning
                    else -> WorkspacePrimary
                }
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(taskColor, CircleShape)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(task.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                Text("Assignee: ${task.assignedToName.ifBlank { "Unassigned" }}", fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                        Text(
                            text = sdf.format(Date(task.dueDate)),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = taskColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    subtitle: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, style = MaterialTheme.typography.bodySmall, color = Color.Gray, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(value, style = MaterialTheme.typography.headlineLarge.copy(color = color, fontWeight = FontWeight.Black))
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp), color = Color.Gray)
        }
    }
}

// ----------------------------------------------------
// TAB 2: TEAMS & PERMISSIONS MANAGEMENT
// ----------------------------------------------------
@Composable
fun TeamsManagementTab(viewModel: AppViewModel) {
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var showPromoteField by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        if (selectedTeam == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Select or spin up a workspace Team from the switcher above.")
            }
            return@Column
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Active Collaboration Code",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = selectedTeam?.inviteCode ?: "",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                    Text(
                        text = "Share with coworkers to invite them",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Team Properties",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = Color.LightGray
        )
        Text(
            text = selectedTeam?.description ?: "No description configured.",
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Active Members List",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))

        val membersList = selectedTeam?.members?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
        val adminsList = selectedTeam?.admins?.split(",")?.filter { it.isNotBlank() } ?: emptyList()

        membersList.forEach { member ->
            val isOwner = member == selectedTeam?.ownerEmail
            val isAdmin = adminsList.contains(member)

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 6.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(WorkspacePrimary.copy(alpha = 0.12f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                member.take(2).uppercase(),
                                color = WorkspacePrimary,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(member, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            val badgeText = when {
                                isOwner -> "Workspace Creator"
                                isAdmin -> "Team Administrator"
                                else -> "Member Partner"
                            }
                            Text(badgeText, fontSize = 11.sp, color = Color.Gray)
                        }
                    }

                    // Administrative quick controls
                    val currentIsOwner = currentUser?.email == selectedTeam?.ownerEmail
                    val currentIsAdmin = adminsList.contains(currentUser?.email ?: "")

                    if ((currentIsOwner || currentIsAdmin) && member != currentUser?.email) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            if (!isAdmin && isOwner.not()) {
                                TextButton(onClick = {
                                    viewModel.promoteMember(selectedTeam!!.id, member)
                                }) {
                                    Text("Make Admin", fontSize = 11.sp, color = WorkspaceTertiary)
                                }
                            }
                            if (isOwner.not()) {
                                TextButton(onClick = {
                                    viewModel.removeMember(selectedTeam!!.id, member)
                                }) {
                                    Text("Remove", fontSize = 11.sp, color = TeamFlowError)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------
// TAB 3: REAL-TIME CHAT
// ----------------------------------------------------
@Composable
fun ChatTab(viewModel: AppViewModel) {
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val activeChatMessages by viewModel.activeChatMessages.collectAsState()
    val typingUsers by viewModel.typingUsers.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var messageInput by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Query for message filter
    var queryText by remember { mutableStateOf("") }

    // Scroll to latest message on update
    LaunchedEffect(activeChatMessages.size, typingUsers.size) {
        if (activeChatMessages.isNotEmpty()) {
            listState.animateScrollToItem(activeChatMessages.size - 1)
        }
    }

    if (selectedTeam == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Select or spin up a team to access real-time chat.")
        }
        return
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Message Search Bar (Satisfying Message Search feature)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = queryText,
                onValueChange = { queryText = it },
                placeholder = { Text("Search messages...", fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, null, modifier = Modifier.size(18.dp)) },
                trailingIcon = {
                    if (queryText.isNotBlank()) {
                        IconButton(onClick = { queryText = "" }) {
                            Icon(Icons.Default.Clear, "Clear search", modifier = Modifier.size(14.dp))
                        }
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("chat_search_bar"),
                singleLine = true,
                shape = RoundedCornerShape(20.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedContainerColor = MaterialTheme.colorScheme.surface
                )
            )
        }

        // Messages List
        val filteredLogs = activeChatMessages.filter {
            queryText.isBlank() || it.content.contains(queryText, ignoreCase = true) || it.senderName.contains(queryText, ignoreCase = true)
        }

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (filteredLogs.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp), contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (queryText.isBlank()) "No messages in this workspace. Wave hello to start real-time interaction!" 
                            else "No match found for '$queryText'. Try another filter.",
                            textAlign = TextAlign.Center,
                            color = Color.Gray,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                items(filteredLogs) { msg ->
                    val isMyMessage = msg.senderEmail == currentUser?.email
                    ChatBubble(msg = msg, isMe = isMyMessage)
                }
            }

            // Typing Indicators simulation from the Server-side Socket.IO
            val typingText = typingUsers[selectedTeam!!.id]
            if (!typingText.isNullOrBlank()) {
                item {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 1.5.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = typingText,
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                            color = Color.Gray
                        )
                    }
                }
            }
        }

        // Input bottom tray
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(0.dp),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Mock attachment picker
                IconButton(onClick = {
                    coroutineScope.launch {
                        viewModel.sendChatMessage("📎 Screen mock attachment uploaded successfully (SpecSheet.pdf)")
                    }
                }) {
                    Icon(Icons.Default.AttachFile, contentDescription = "Add attachment")
                }

                // Main Text Input
                OutlinedTextField(
                    value = messageInput,
                    onValueChange = { messageInput = it },
                    placeholder = { Text("Message #${selectedTeam?.name ?: ""}") },
                    modifier = Modifier
                        .weight(1f)
                        .testTag("chat_message_input"),
                    shape = RoundedCornerShape(24.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    ),
                    maxLines = 3,
                    singleLine = false
                )

                Spacer(modifier = Modifier.width(4.dp))

                // Send Button
                IconButton(
                    onClick = {
                        if (messageInput.isNotBlank()) {
                            viewModel.sendChatMessage(messageInput)
                            messageInput = ""
                        }
                    },
                    modifier = Modifier.testTag("chat_send_btn")
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = "Send Message",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}

@Composable
fun ChatBubble(msg: Message, isMe: Boolean) {
    val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
    val timestampStr = sdf.format(Date(msg.createdAt))

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
    ) {
        if (!isMe) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(WorkspacePrimary.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(msg.senderName.take(1).uppercase(), color = WorkspacePrimary, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(
            horizontalAlignment = if (isMe) Alignment.End else Alignment.Start,
            modifier = Modifier.widthIn(max = 260.dp)
        ) {
            if (!isMe) {
                Text(msg.senderName, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
            }
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isMe) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                ),
                shape = RoundedCornerShape(
                    topStart = 12.dp,
                    topEnd = 12.dp,
                    bottomStart = if (isMe) 12.dp else 4.dp,
                    bottomEnd = if (isMe) 4.dp else 12.dp
                ),
                modifier = Modifier.padding(top = 2.dp)
            ) {
                Text(
                    text = msg.content,
                    color = if (isMe) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    fontSize = 14.sp
                )
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 2.dp)
            ) {
                Text(timestampStr, fontSize = 9.sp, color = Color.Gray)
                Spacer(modifier = Modifier.width(4.dp))
                // Read Receipt feature simulator
                Icon(
                    imageVector = Icons.Default.DoneAll,
                    contentDescription = "Delivered & Read",
                    tint = WorkspaceTertiary,
                    modifier = Modifier.size(10.dp)
                )
            }
        }
    }
}

// ----------------------------------------------------
// TAB 4: TASKS INTEGRATED KANBAN SYSTEM
// ----------------------------------------------------
@Composable
fun TasksBoardTab(viewModel: AppViewModel) {
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val activeTasks by viewModel.activeTasks.collectAsState()

    var showAddTaskDialog by remember { mutableStateOf(false) }
    var selectedTaskForDetails by remember { mutableStateOf<Task?>(null) }

    // Column Filters (TO-DO, IN_PROGRESS, REVIEW, DONE)
    var selectedPriorityFilter by remember { mutableStateOf("ALL") } // ALL, LOW, MEDIUM, HIGH, URGENT

    if (selectedTeam == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Select or spin up a workspace Team to access task items.")
        }
        return
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Priority filter row + Add Buttons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Priority Row
            Box {
                var expandedFilterMenu by remember { mutableStateOf(false) }
                Button(
                    onClick = { expandedFilterMenu = true },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.FilterList, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Rank Priority: $selectedPriorityFilter")
                }

                DropdownMenu(expanded = expandedFilterMenu, onDismissRequest = { expandedFilterMenu = false }) {
                    listOf("ALL", "LOW", "MEDIUM", "HIGH", "URGENT").forEach { priority ->
                        DropdownMenuItem(
                            text = { Text(priority) },
                            onClick = {
                                selectedPriorityFilter = priority
                                expandedFilterMenu = false
                            }
                        )
                    }
                }
            }

            // Create Task Action
            Button(
                onClick = { showAddTaskDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = WorkspacePrimary),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("add_task_trigger")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add tasks")
                Spacer(modifier = Modifier.width(6.dp))
                Text("Add Task")
            }
        }

        // Kanban Board Columns View (Scroller for different columns)
        val columns = listOf(
            "TODO" to "To Do 🎯",
            "IN_PROGRESS" to "In Progress ⚙️",
            "REVIEW" to "In Review 👀",
            "DONE" to "Done ✅"
        )

        // Render standard scrollable Row container for boards
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .horizontalScroll(rememberScrollState())
                .padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            columns.forEach { (statusCode, titleLabel) ->
                val matchingTasks = activeTasks.filter {
                    it.status == statusCode && (selectedPriorityFilter == "ALL" || it.priority == selectedPriorityFilter)
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.2f)),
                    modifier = Modifier
                        .width(280.dp)
                        .fillMaxHeight(),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "$titleLabel (${matchingTasks.size})",
                                modifier = Modifier.padding(vertical = 6.dp, horizontal = 10.dp),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            if (matchingTasks.isEmpty()) {
                                item {
                                    Text(
                                        "No tasks in this pipeline.",
                                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                                        textAlign = TextAlign.Center,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color.Gray
                                    )
                                }
                            } else {
                                items(matchingTasks) { item ->
                                    KanbanTaskCard(
                                        task = item,
                                        onSelected = { selectedTaskForDetails = item },
                                        onStatusShift = { targetStatus ->
                                            viewModel.updateTaskStatus(item.id, targetStatus)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Task Dialog
    if (showAddTaskDialog) {
        AddTaskDialog(
            viewModel = viewModel,
            onDismiss = { showAddTaskDialog = false }
        )
    }

    // Task details (with comments and activity logs)
    if (selectedTaskForDetails != null) {
        TaskDetailsDialog(
            task = selectedTaskForDetails!!,
            viewModel = viewModel,
            onDismiss = { selectedTaskForDetails = null }
        )
    }
}

@Composable
fun KanbanTaskCard(task: Task, onSelected: () -> Unit, onStatusShift: (String) -> Unit) {
    val priorityColor = when (task.priority) {
        "LOW" -> WorkspacePrimary
        "MEDIUM" -> TeamFlowInfo
        "HIGH" -> TeamFlowWarning
        "URGENT" -> TeamFlowError
        else -> Color.Gray
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelected() },
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .background(priorityColor.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(task.priority, color = priorityColor, fontWeight = FontWeight.Bold, fontSize = 9.sp)
                }

                // Control panel to quick shift pipelines
                Box {
                    var expandedShift by remember { mutableStateOf(false) }
                    Icon(
                        Icons.Default.MoreVert,
                        contentDescription = "Shift Column",
                        modifier = Modifier
                            .clickable { expandedShift = true }
                            .size(16.dp)
                    )

                    DropdownMenu(expanded = expandedShift, onDismissRequest = { expandedShift = false }) {
                        listOf(
                            "TODO" to "🎯 Move to To-Do",
                            "IN_PROGRESS" to "⚙️ Move In-Progress",
                            "REVIEW" to "👀 Move to review",
                            "DONE" to "✅ Mark Done"
                        ).forEach { (code, label) ->
                            DropdownMenuItem(
                                text = { Text(label, fontSize = 12.sp) },
                                onClick = {
                                    onStatusShift(code)
                                    expandedShift = false
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = task.title,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = task.description,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                color = Color.Gray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.PersonOutline, null, modifier = Modifier.size(12.dp), tint = Color.LightGray)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (task.assignedToName.isNotBlank()) task.assignedToName else "Claim task",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                        color = Color.Gray
                    )
                }

                // comments count badge
                val commentsCount = remember(task.commentsJson) {
                    try {
                        val elements = task.commentsJson.count { it == '{' }
                        elements
                    } catch (e: Exception) {
                        0
                    }
                }
                if (commentsCount > 0) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Comment, null, modifier = Modifier.size(11.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(commentsCount.toString(), fontSize = 9.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun AddTaskDialog(viewModel: AppViewModel, onDismiss: () -> Unit) {
    var title by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var assigneeEmail by remember { mutableStateOf("") }
    var assigneeName by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("MEDIUM") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.padding(12.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Create Team Milestone Tasks", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title") },
                    modifier = Modifier.fillMaxWidth().testTag("add_task_title"),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Task Description") },
                    modifier = Modifier.fillMaxWidth().height(80.dp).testTag("add_task_desc")
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = assigneeEmail,
                    onValueChange = { assigneeEmail = it },
                    label = { Text("Assignee Email (Optional)") },
                    modifier = Modifier.fillMaxWidth().testTag("add_task_assignee_email"),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = assigneeName,
                    onValueChange = { assigneeName = it },
                    label = { Text("Assignee Display Name") },
                    modifier = Modifier.fillMaxWidth().testTag("add_task_assignee_name"),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(10.dp))

                Text("Priority Level", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("LOW", "MEDIUM", "HIGH", "URGENT").forEach { level ->
                        val isSelected = priority == level
                        Button(
                            onClick = { priority = level },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(2.dp)
                        ) {
                            Text(level, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            viewModel.createTeamTask(title, desc, assigneeEmail, assigneeName, priority)
                            onDismiss()
                        }
                    },
                    modifier = Modifier.fillMaxWidth().testTag("add_task_submit_btn")
                ) {
                    Text("Push Milestone to Kanban", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun TaskDetailsDialog(task: Task, viewModel: AppViewModel, onDismiss: () -> Unit) {
    var commentInput by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    // Periodically re-observe tasks to dynamically fetch comments updates
    val activeTasks by viewModel.activeTasks.collectAsState()
    val currentTaskState = activeTasks.find { it.id == task.id } ?: task

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Milestone Task Detail", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Close details")
                    }
                }

                Divider()

                Spacer(modifier = Modifier.height(10.dp))

                Text(currentTaskState.title, style = MaterialTheme.typography.bodyLarge.copy(fontSize = 18.sp, fontWeight = FontWeight.ExtraBold), color = MaterialTheme.colorScheme.primary)
                Text(currentTaskState.description, style = MaterialTheme.typography.bodyMedium, color = Color.DarkGray)

                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Status: ${currentTaskState.status}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                    Text("|", fontSize = 11.sp, color = Color.Gray)
                    Text("Priority: ${currentTaskState.priority}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = WorkspaceSecondary)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Toggle tabs or split view for Comments & Logs
                Text("Discussion Thread", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(6.dp))

                // Custom mini scroller for Comments
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .border(1.dp, Color.LightGray, RoundedCornerShape(6.dp))
                        .background(Color(0xFFFAFAFA))
                        .padding(8.dp)
                ) {
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        // Custom light parse comments: [{"author":"sarah","content":"hi", "time":123}]
                        val commentList = parseCommentsJson(currentTaskState.commentsJson)
                        if (commentList.isEmpty()) {
                            item {
                                Text(
                                    "No comments on this team milestone yet. Start typing to stay aligned.",
                                    modifier = Modifier.padding(16.dp),
                                    textAlign = TextAlign.Center,
                                    fontSize = 12.sp,
                                    color = Color.Gray
                                )
                            }
                        } else {
                            items(commentList) { cItem ->
                                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                        Text(cItem.author, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = WorkspacePrimary)
                                        Text(SimpleDateFormat("MM/dd HH:mm", Locale.getDefault()).format(Date(cItem.time)), fontSize = 8.sp, color = Color.Gray)
                                    }
                                    Text(cItem.content, fontSize = 12.sp, color = Color.Black)
                                    Divider(color = Color.LightGray.copy(alpha = 0.5f), modifier = Modifier.padding(top = 4.dp))
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = commentInput,
                        onValueChange = { commentInput = it },
                        placeholder = { Text("Write inline comment...", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f).testTag("task_comment_input"),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    IconButton(
                        onClick = {
                            viewModel.addTaskComment(currentTaskState.id, commentInput)
                            commentInput = ""
                        },
                        modifier = Modifier.testTag("task_comment_submit_btn")
                    ) {
                        Icon(Icons.Default.Send, "Post comment")
                    }
                }
            }
        }
    }
}

data class SimpleComment(val author: String, val content: String, val time: Long)

fun parseCommentsJson(commentsJson: String): List<SimpleComment> {
    if (commentsJson == "[]" || commentsJson.isBlank()) return emptyList()
    val list = mutableListOf<SimpleComment>()
    try {
        // Safe linear parse
        val regex = "\"author\":\"([^\"]*)\",\"content\":\"([^\"]*)\",\"time\":([0-9]*)"
        val pattern = java.util.regex.Pattern.compile(regex)
        val matcher = pattern.matcher(commentsJson)
        while (matcher.find()) {
            val author = matcher.group(1) ?: ""
            val content = matcher.group(2) ?: ""
            val time = matcher.group(3)?.toLongOrNull() ?: 0L
            list.add(SimpleComment(author, content, time))
        }
    } catch (e: Exception) {
        // Fallback
    }
    return list
}

// ----------------------------------------------------
// TAB 5: VOICE/VIDEO MEETING SIMULATOR (Jitsi Integration)
// ----------------------------------------------------
@Composable
fun JitsiMeetingsTab(viewModel: AppViewModel) {
    val selectedTeam by viewModel.selectedTeam.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var inCallMode by remember { mutableStateOf(false) }
    var micMuted by remember { mutableStateOf(false) }
    var cameraOn by remember { mutableStateOf(true) }
    var screenSharing by remember { mutableStateOf(false) }

    if (selectedTeam == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Select or spin up a team to initiate video conference call.")
        }
        return
    }

    if (!inCallMode) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .background(WorkspacePrimary.copy(alpha = 0.12f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.VideoCall,
                        contentDescription = "Meeting room",
                        modifier = Modifier.size(48.dp),
                        tint = WorkspacePrimary
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "TeamFlow Jitsi Meeting Hall",
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Simulate highly responsive embedded virtual rooms inside your workspace. Audio calls, dual layout screen sharing configured automatically.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(28.dp))
                Button(
                    onClick = { inCallMode = true },
                    colors = ButtonDefaults.buttonColors(containerColor = WorkspacePrimary),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp).testTag("meetings_join_call_btn")
                ) {
                    Text("Enter Team Room Meeting Slot", fontWeight = FontWeight.Bold)
                }
            }
        }
    } else {
        // Simulated video call interface !! (Glassmorphism look with user grids)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0F172A)) // dark screen matching conference tools
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Topic header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "Sprint Review Room: ${selectedTeam?.name ?: ""}",
                            color = Color.White,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text("Connected: 3 active members", color = Color.Gray, fontSize = 11.sp)
                    }

                    Box(
                        modifier = Modifier
                            .background(Color.Red, RoundedCornerShape(4.dp))
                            .padding(4.dp)
                    ) {
                        Text("REC", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 9.sp)
                    }
                }

                // Grid of Participants (2x2 layout simulator)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        VideoParticipantCard(
                            name = currentUser?.fullname ?: "You",
                            cameraOn = cameraOn,
                            muted = micMuted,
                            waveActive = !micMuted,
                            isScreenSharing = screenSharing,
                            modifier = Modifier.weight(1f)
                        )
                        VideoParticipantCard(
                            name = "Sarah Mensah",
                            cameraOn = true,
                            muted = false,
                            waveActive = true,
                            isScreenSharing = false,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(
                        modifier = Modifier.weight(1f),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        VideoParticipantCard(
                            name = "Kojo Asante",
                            cameraOn = false,
                            muted = true,
                            waveActive = false,
                            isScreenSharing = false,
                            modifier = Modifier.weight(1f)
                        )
                        VideoParticipantCard(
                            name = "Abishola Alao",
                            cameraOn = true,
                            muted = false,
                            waveActive = true,
                            isScreenSharing = false,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // Control panel
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(16.dp, 16.dp, 0.dp, 0.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp, horizontal = 24.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Mute button
                        IconButton(
                            onClick = { micMuted = !micMuted },
                            modifier = Modifier
                                .background(if (micMuted) Color.Red else Color.DarkGray, CircleShape)
                                .testTag("meetings_mic_btn")
                        ) {
                            Icon(
                                imageVector = if (micMuted) Icons.Default.MicOff else Icons.Default.Mic,
                                contentDescription = "Toggle Mic",
                                tint = Color.White
                            )
                        }

                        // Camera toggle
                        IconButton(
                            onClick = { cameraOn = !cameraOn },
                            modifier = Modifier
                                .background(if (!cameraOn) Color.Red else Color.DarkGray, CircleShape)
                                .testTag("meetings_camera_btn")
                        ) {
                            Icon(
                                imageVector = if (cameraOn) Icons.Default.Videocam else Icons.Default.VideocamOff,
                                contentDescription = "Toggle Cam",
                                tint = Color.White
                            )
                        }

                        // Screen share toggle
                        IconButton(
                            onClick = { screenSharing = !screenSharing },
                            modifier = Modifier
                                .background(if (screenSharing) WorkspacePrimary else Color.DarkGray, CircleShape)
                                .testTag("meetings_screenshare_btn")
                        ) {
                            Icon(
                                imageVector = if (screenSharing) Icons.Default.ScreenShare else Icons.Default.StopScreenShare,
                                contentDescription = "Toggle share screen",
                                tint = Color.White
                            )
                        }

                        // Leave Call
                        Button(
                            onClick = { inCallMode = false },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.testTag("meetings_leave_btn")
                        ) {
                            Text("Hang up", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VideoParticipantCard(
    name: String,
    cameraOn: Boolean,
    muted: Boolean,
    waveActive: Boolean,
    isScreenSharing: Boolean,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFF1E293B))
            .border(2.dp, if (waveActive) WorkspacePrimary else Color.Transparent, RoundedCornerShape(8.dp)),
        contentAlignment = Alignment.Center
    ) {
        if (isScreenSharing) {
            // Display mock desktop screenshot or screen sharing indicators
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Dvr, "Screen casting", tint = WorkspacePrimary, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.height(4.dp))
                Text("Sharing custom desktop...", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        } else if (cameraOn) {
            // Display dynamic mock profile video camera active indicator
            Box(modifier = Modifier.fillMaxSize()) {
                // Background gradient simulating video source
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF3F51B5), Color(0xFFE91E63))
                            )
                        )
                )

                // Active avatar profile overlap
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                        .align(Alignment.Center),
                    contentAlignment = Alignment.Center
                ) {
                    Text(name.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Black)
                }
            }
        } else {
            // Camera is closed
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(Color.DarkGray, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(name.take(2).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
            }
        }

        // Overlay controls display
        Row(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = Color.Black.copy(alpha = 0.5f),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text(
                    text = name,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    color = Color.White,
                    fontSize = 11.sp
                )
            }

            if (muted) {
                Icon(
                    imageVector = Icons.Default.MicOff,
                    contentDescription = "Muted",
                    tint = Color.Red,
                    modifier = Modifier.size(14.dp)
                )
            } else {
                Icon(
                    imageVector = Icons.Default.VolumeUp,
                    contentDescription = "Speaking",
                    tint = WorkspaceTertiary,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

// ----------------------------------------------------
// TAB 6: PAYMENTS & BILLING HISTORY (Ghana MoMo Integrations)
// ----------------------------------------------------
@Composable
fun PaymentsHistoryTab(viewModel: AppViewModel) {
    val currentUser by viewModel.currentUser.collectAsState()
    val allPayments by viewModel.allPayments.collectAsState()

    val myEmail = currentUser?.email ?: ""
    val userPaymentsList = allPayments.filter { it.userEmail == myEmail }

    val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Active plan container
        Card(
            modifier = Modifier.fillMaxWidth(),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Current TeamFlow Plan status", style = MaterialTheme.typography.bodySmall, color = Color.Gray, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "${currentUser?.subscriptionPlan?.ifBlank { "Unsubscribed" }} Monthly Upgrade",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold)
                    )
                    Box(
                        modifier = Modifier
                            .background(WorkspaceTertiary.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = currentUser?.subscriptionStatus ?: "PENDING",
                            color = WorkspaceTertiary,
                            fontWeight = FontWeight.Black,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                val dateExpiry = currentUser?.subscriptionExpiry ?: 0
                Text(
                    text = "Renewal Date: ${sdf.format(Date(dateExpiry))}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Ghana Mobile Money Receipts Audit",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))

        if (userPaymentsList.isEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.1f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "No recorded transacted receipts on Mobile Money checkout.",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            userPaymentsList.forEach { receipt ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Ref Code: ${receipt.reference}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Network: ${receipt.network} via ${receipt.provider}", fontSize = 11.sp, color = Color.Gray)
                            Text("Processed: ${sdf.format(Date(receipt.paidAt))}", fontSize = 10.sp, color = Color.LightGray)
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "GHS ${receipt.amount.toInt()}.00",
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.primary,
                                fontSize = 15.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .background(WorkspaceTertiary.copy(alpha = 0.12f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(receipt.status, color = WorkspaceTertiary, fontWeight = FontWeight.Bold, fontSize = 9.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------
// TAB 7: SUPER ADMIN DASHBOARD PANEL (Super Admin Only)
// ----------------------------------------------------
@Composable
fun SuperAdminPanelTab(viewModel: AppViewModel) {
    val allUsers by viewModel.allUsers.collectAsState()
    val allPayments by viewModel.allPayments.collectAsState()

    var activeViewToggle by remember { mutableStateOf("METRICS") } // METRICS, USERS, AUDIT

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        TabRow(selectedTabIndex = if (activeViewToggle == "METRICS") 0 else if (activeViewToggle == "USERS") 1 else 2) {
            Tab(selected = activeViewToggle == "METRICS", onClick = { activeViewToggle = "METRICS" }) {
                Text("Saas Metrics", modifier = Modifier.padding(10.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            Tab(selected = activeViewToggle == "USERS", onClick = { activeViewToggle = "USERS" }) {
                Text("Manage Users", modifier = Modifier.padding(10.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
            Tab(selected = activeViewToggle == "AUDIT", onClick = { activeViewToggle = "AUDIT" }) {
                Text("Payment Audit", modifier = Modifier.padding(10.dp), fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        when (activeViewToggle) {
            "METRICS" -> {
                // aggregate stats
                val totalARR = allPayments.sumOf { it.amount }
                val totalSubscribers = allUsers.filter { it.subscriptionStatus == "ACTIVE" }.size

                Text("Analytics Summary", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        title = "Cumulative Revenue",
                        value = "GHS ${totalARR.toInt()}",
                        subtitle = "Subscription receipts",
                        color = WorkspaceTertiary,
                        modifier = Modifier.weight(1f)
                    )
                    MetricCard(
                        title = "Total Active SaaS Teams",
                        value = totalSubscribers.toString(),
                        subtitle = "Active GHS Workspaces",
                        color = WorkspacePrimary,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("ARR Projected Growth Chart", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Fake visual micro grid representing ARR growth
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            verticalAlignment = Alignment.Bottom,
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            listOf(20, 35, 50, 40, 75, 95).forEachIndexed { i, valHeight ->
                                Box(
                                    modifier = Modifier
                                        .width(30.dp)
                                        .fillMaxHeight(valHeight / 100f)
                                        .background(WorkspacePrimary, RoundedCornerShape(4.dp, 4.dp, 0.dp, 0.dp))
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun").forEach { month ->
                                Text(month, fontSize = 9.sp, color = Color.Gray)
                            }
                        }
                    }
                }
            }
            "USERS" -> {
                Text("All TeamFlow Subscribed Users", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                allUsers.forEach { user ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(user.fullname, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(user.email, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    // Subscription status indicator
                                    AssistChip(
                                        onClick = {},
                                        label = { Text(user.subscriptionStatus, fontSize = 10.sp) },
                                        colors = AssistChipDefaults.assistChipColors(
                                            labelColor = if (user.subscriptionStatus == "ACTIVE") WorkspaceTertiary else TeamFlowError
                                        )
                                    )
                                }
                            }

                            // Suspend/Unsuspend & Role actions
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider(color = Color.LightGray.copy(alpha = 0.5f))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                Alignment.CenterVertically
                            ) {
                                Text("Actions:", fontSize = 11.sp, color = Color.LightGray)
                                TextButton(onClick = {
                                    val nextStatus = if (user.subscriptionStatus == "ACTIVE") "EXPIRED" else "ACTIVE"
                                    viewModel.adminUpdateUser(user.email, user.role, nextStatus)
                                }) {
                                    Text(
                                        text = if (user.subscriptionStatus == "ACTIVE") "Suspend" else "Activate Access",
                                        fontSize = 11.sp,
                                        color = if (user.subscriptionStatus == "ACTIVE") TeamFlowError else WorkspaceTertiary
                                    )
                                }
                                TextButton(onClick = {
                                    val nextRole = if (user.role == "SUPER_ADMIN") "MEMBER" else "SUPER_ADMIN"
                                    viewModel.adminUpdateUser(user.email, nextRole, user.subscriptionStatus)
                                }) {
                                    Text(
                                        text = if (user.role == "SUPER_ADMIN") "Make Member" else "Grant Admin",
                                        fontSize = 11.sp,
                                        color = WorkspacePrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }
            "AUDIT" -> {
                Text("Ghana Mobile Money Log Audits", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                allPayments.forEach { pay ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Ref: ${pay.reference}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Recipient User: ${pay.userEmail}", fontSize = 11.sp)
                                Text("Momo Wallet: ${pay.provider} on ${pay.network}", fontSize = 10.sp, color = Color.Gray)
                            }
                            Text(
                                "GHS ${pay.amount.toInt()}.00",
                                fontWeight = FontWeight.Black,
                                color = WorkspaceTertiary
                            )
                        }
                    }
                }
            }
        }
    }
}
