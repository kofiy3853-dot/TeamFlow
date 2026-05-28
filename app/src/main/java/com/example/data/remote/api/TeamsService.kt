package com.example.data.remote.api

import retrofit2.Response
import retrofit2.http.*

// ---- Teams ----
data class TeamDto(
    val _id: String,
    val name: String,
    val description: String?,
    val inviteCode: String,
    val members: List<String>,
    val admins: List<String>
)
data class TeamsResponse(val teams: List<TeamDto>)
data class TeamResponse(val team: TeamDto)
data class CreateTeamRequest(val name: String, val description: String)
data class JoinTeamRequest(val inviteCode: String)

interface TeamsService {
    @GET("api/teams")
    suspend fun getMyTeams(): Response<TeamsResponse>

    @POST("api/teams")
    suspend fun createTeam(@Body request: CreateTeamRequest): Response<TeamResponse>

    @POST("api/teams/join")
    suspend fun joinTeam(@Body request: JoinTeamRequest): Response<TeamResponse>
}
