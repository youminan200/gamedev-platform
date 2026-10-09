package com.devground.app.api

import com.devground.app.models.DevLog
import com.devground.app.models.DevLogCreateRequest
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import com.devground.app.getPlatform

object ApiClient {
    val client = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }
    }
    
    private val BASE_URL = if (getPlatform().name.contains("Android")) {
        "http://172.16.11.203:3001/api"
    } else {
        "http://127.0.0.1:3001/api"
    }

    suspend fun getDevLogs(): List<DevLog> {
        return client.get("$BASE_URL/devlogs").body()
    }

    suspend fun postDevLog(request: DevLogCreateRequest): DevLog {
        return client.post("$BASE_URL/devlogs") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }
}
