package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable

enum class SubscriptionStatus {
    ACTIVE, PENDING, EXPIRED, CANCELLED
}

enum class UserRole {
    OWNER, ADMIN, MEMBER, SUPER_ADMIN
}

enum class TaskStatus {
    TODO, IN_PROGRESS, REVIEW, DONE
}

enum class TaskPriority {
    LOW, MEDIUM, HIGH, URGENT
}

enum class NotificationType {
    INFO, WARNING, SUCCESS, ERROR
}

@Entity(tableName = "users")
data class User(
    @PrimaryKey val email: String,
    val fullname: String,
    val phone: String,
    val passwordHash: String,
    val avatar: String = "",
    val subscriptionStatus: String = "PENDING", // SubscriptionStatus name
    val subscriptionPlan: String = "", // Basic, Pro, Enterprise
    val subscriptionExpiry: Long = 0,
    val role: String = "MEMBER", // UserRole name
    val joinedTeams: String = "", // Comma-separated team IDs
    val createdAt: Long = System.currentTimeMillis()
) : Serializable

@Entity(tableName = "teams")
data class Team(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val avatarBgColor: Int = 0xFF5C6BC0.toInt(), // Modern background hex
    val ownerEmail: String,
    val admins: String = "", // Comma-separated emails
    val members: String = "", // Comma-separated emails
    val inviteCode: String,
    val createdAt: Long = System.currentTimeMillis()
) : Serializable

@Entity(tableName = "messages")
data class Message(
    @PrimaryKey val id: String,
    val teamId: String,
    val senderEmail: String,
    val senderName: String,
    val content: String,
    val attachmentsJson: String = "", // JSON or URL list
    val reactionsJson: String = "", // JSON mapped reactions
    val createdAt: Long = System.currentTimeMillis()
) : Serializable

@Entity(tableName = "tasks")
data class Task(
    @PrimaryKey val id: String,
    val teamId: String,
    val title: String,
    val description: String,
    val assignedToEmail: String = "",
    val assignedToName: String = "",
    val priority: String = "MEDIUM", // TaskPriority name
    val status: String = "TODO", // TaskStatus name
    val dueDate: Long = 0,
    val commentsJson: String = "[]", // JSON serialized comments
    val activityLogsJson: String = "[]", // JSON history events
    val createdAt: Long = System.currentTimeMillis()
) : Serializable

@Entity(tableName = "payments")
data class Payment(
    @PrimaryKey val id: String,
    val userEmail: String,
    val amount: Double,
    val provider: String, // Paystack, Hubtel
    val network: String, // MTN, Telecel, AirtelTigo
    val reference: String,
    val status: String, // SUCCESS, FAILED, PENDING
    val paidAt: Long = System.currentTimeMillis(),
    val subscriptionStart: Long = 0,
    val subscriptionEnd: Long = 0
) : Serializable

@Entity(tableName = "notifications")
data class AppNotification(
    @PrimaryKey val id: String,
    val userEmail: String,
    val title: String,
    val message: String,
    val type: String = "INFO", // NotificationType name
    val isRead: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
) : Serializable
