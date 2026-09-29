package com.devground.app

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform