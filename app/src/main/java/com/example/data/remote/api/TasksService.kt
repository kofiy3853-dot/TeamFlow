package com.example.data.remote.api

import retrofit2.Response
import retrofit2.http.*

// ---- Tasks ----
data class AssignedUserDto(val _id: String, val fullname: String, val email: String)
data class TeamRefDto(val _id: String, val name: String)

data class TaskDto(
    val _id: String,
    val title: String,
    val description: String?,
    val priority: String,
    val status: String,
    val team: TeamRefDto?,
    val assignedTo: List<AssignedUserDto>,
    val dueDate: String?
)

data class CreateTaskRequest(
    val title: String,
    val description: String,
    val teamId: String,
    val priority: String,
    val status: String,
    val assignedTo: List<String>,
    val dueDate: String?
)

data class UpdateTaskStatusRequest(val status: String)

interface TasksService {
    @GET("api/tasks")
    suspend fun getMyTasks(): Response<List<TaskDto>>

    @POST("api/tasks")
    suspend fun createTask(@Body request: CreateTaskRequest): Response<TaskDto>

    @PATCH("api/tasks/{id}")
    suspend fun updateTaskStatus(
        @Path("id") taskId: String,
        @Body request: UpdateTaskStatusRequest
    ): Response<TaskDto>
}
