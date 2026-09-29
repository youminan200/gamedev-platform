package com.devground.app.models

import kotlinx.serialization.Serializable

@Serializable
data class DevLog(
    val id: String,
    val title: String,
    val author: String,
    val likes: Int,
    val tags: List<String>
)

@Serializable
data class DevLogCreateRequest(
    val title: String,
    val author: String,
    val tags: List<String>
)
