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
    
    // 안드로이드 에뮬레이터 환경에 따라 10.0.2.2가 작동하지 않는 경우가 있어 확실한 호스트 PC의 로컬 IP(192.168.0.5)를 사용합니다.
    private val BASE_URL = if (getPlatform().name.contains("Android")) {
        "http://192.168.0.5:3000/api"
    } else {
        "http://127.0.0.1:3000/api"
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
