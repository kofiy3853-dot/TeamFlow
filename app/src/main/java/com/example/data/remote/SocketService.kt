package com.example.data.remote

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.net.URISyntaxException

// Represents an incoming Socket.IO chat message
data class SocketMessage(
    val teamId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Socket.IO client — event names match server.js exactly:
 *   EMIT:    join-team    { teamId, userId }
 *   EMIT:    send-message { teamId, content, sender:{id,name,email} }
 *   EMIT:    typing       { teamId, userId, userName }
 *   EMIT:    stop-typing  { teamId, userId }
 *
 *   LISTEN:  new-message  { id, content, sender, teamId, createdAt }
 *   LISTEN:  user-typing  { userId, userName }
 *   LISTEN:  user-stop-typing { userId }
 */
object SocketService {
    private const val TAG = "SocketService"
    // Production WebSocket server (Render deployment)
    private const val SERVER_URL = "https://teamflow-31ae.onrender.com"
    // For local dev with emulator, swap to: "http://10.0.2.2:3000"

    private var socket: Socket? = null
    private var currentUserId: String = ""
    private var currentUserName: String = ""

    private val _incomingMessages = MutableSharedFlow<SocketMessage>(extraBufferCapacity = 64)
    val incomingMessages: SharedFlow<SocketMessage> = _incomingMessages.asSharedFlow()

    private val _typingEvent = MutableSharedFlow<Pair<String, String>>(extraBufferCapacity = 32)
    val typingEvent: SharedFlow<Pair<String, String>> = _typingEvent.asSharedFlow() // (userId, userName)

    private val _stopTypingEvent = MutableSharedFlow<String>(extraBufferCapacity = 32)
    val stopTypingEvent: SharedFlow<String> = _stopTypingEvent.asSharedFlow() // userId

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    fun connect(token: String, userId: String = "", userName: String = "") {
        if (socket?.connected() == true) return
        currentUserId = userId
        currentUserName = userName

        try {
            val opts = IO.Options.builder()
                .setAuth(mapOf("token" to token))
                .setReconnection(true)
                .setReconnectionAttempts(5)
                .build()

            socket = IO.socket(SERVER_URL, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Socket connected: ${socket?.id()}")
                _isConnected.tryEmit(true)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Socket disconnected")
                _isConnected.tryEmit(false)
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e(TAG, "Socket connect error: ${args.firstOrNull()}")
                _isConnected.tryEmit(false)
            }

            // Server emits "new-message" when a chat message is broadcast to the room
            socket?.on("new-message") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                val sender = data.optJSONObject("sender")
                val msg = SocketMessage(
                    teamId     = data.optString("teamId"),
                    senderId   = sender?.optString("id") ?: sender?.optString("_id") ?: "",
                    senderName = sender?.optString("name") ?: sender?.optString("fullname") ?: "",
                    content    = data.optString("content")
                )
                _incomingMessages.tryEmit(msg)
            }

            // Server emits "user-typing" { userId, userName }
            socket?.on("user-typing") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                val userId   = data.optString("userId")
                val userName = data.optString("userName")
                _typingEvent.tryEmit(userId to userName)
            }

            // Server emits "user-stop-typing" { userId }
            socket?.on("user-stop-typing") { args ->
                val data = args.firstOrNull() as? JSONObject ?: return@on
                _stopTypingEvent.tryEmit(data.optString("userId"))
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid server URI", e)
        }
    }

    /** Join a team room — server listens on "join-team" with (teamId, userId) */
    fun joinRoom(teamId: String) {
        socket?.emit("join-team", teamId, currentUserId)
    }

    /** No explicit leave event on this server — simply stop listening; Room GC happens on disconnect */
    fun leaveRoom(teamId: String) {
        // Server doesn't have a "leave-team" event; the room is managed server-side per-socket
        Log.d(TAG, "Leaving room $teamId (client-side only)")
    }

    /** Send a chat message — server listens on "send-message" */
    fun sendMessage(teamId: String, content: String, senderId: String, senderName: String, senderEmail: String = "") {
        val sender = JSONObject().apply {
            put("id", senderId)
            put("name", senderName)
            put("email", senderEmail)
        }
        val payload = JSONObject().apply {
            put("teamId", teamId)
            put("content", content)
            put("sender", sender)
        }
        socket?.emit("send-message", payload)
    }

    /** Emit typing started — server listens on "typing" */
    fun emitTyping(teamId: String) {
        val payload = JSONObject().apply {
            put("teamId", teamId)
            put("userId", currentUserId)
            put("userName", currentUserName)
        }
        socket?.emit("typing", payload)
    }

    /** Emit typing stopped — server listens on "stop-typing" */
    fun emitStopTyping(teamId: String) {
        val payload = JSONObject().apply {
            put("teamId", teamId)
            put("userId", currentUserId)
        }
        socket?.emit("stop-typing", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
        _isConnected.tryEmit(false)
    }
}
