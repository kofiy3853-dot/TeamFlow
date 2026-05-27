package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.ViewModelProvider
import com.example.data.local.AppDatabase
import com.example.data.repository.AppRepository
import com.example.ui.screens.MainAppContainer
import com.example.ui.theme.TeamFlowTheme
import com.example.ui.viewmodel.AppViewModel
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var viewModel: AppViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 1. Initialize DB container
        val database = AppDatabase.getDatabase(this)
        
        // 2. Setup DAOs and single Repository
        val repository = AppRepository(
            userDao = database.userDao(),
            teamDao = database.teamDao(),
            messageDao = database.messageDao(),
            taskDao = database.taskDao(),
            paymentDao = database.paymentDao(),
            notificationDao = database.notificationDao()
        )

        // Prepopulate database with Super Admin default user for easier initial testing
        CoroutineScope(Dispatchers.IO).launch {
            val superAdminEmail = "admin@teamflow.com"
            val existing = database.userDao().getUserByEmailOneShot(superAdminEmail)
            if (existing == null) {
                repository.register(
                    fullname = "Default Super Admin",
                    email = superAdminEmail,
                    phone = "0550000000",
                    passwordHash = "admin",
                    isSuperAdmin = true
                )
            }
        }

        // 3. Initialize Unified AppViewModel
        viewModel = ViewModelProvider(
            this,
            AppViewModel.Factory(repository)
        )[AppViewModel::class.java]

        setContent {
            TeamFlowTheme {
                MainAppContainer(viewModel = viewModel)
            }
        }
    }
}
