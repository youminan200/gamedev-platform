package com.devground.app

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.tooling.preview.Preview
import com.devground.app.ui.DetailScreen
import com.devground.app.ui.MainFeedScreen
import com.devground.app.ui.PostingScreen
import com.devground.app.ui.theme.RetroTheme

sealed class Screen {
    object MainFeed : Screen()
    data class Detail(val id: String) : Screen()
    object Posting : Screen()
}

@Composable
@Preview
fun App() {
    RetroTheme {
        var currentScreen by remember { mutableStateOf<Screen>(Screen.MainFeed) }

        when (val screen = currentScreen) {
            is Screen.MainFeed -> {
                MainFeedScreen(
                    onDevLogClick = { id -> currentScreen = Screen.Detail(id) },
                    onPostClick = { currentScreen = Screen.Posting }
                )
            }
            is Screen.Detail -> {
                DetailScreen(
                    devLogId = screen.id,
                    onBack = { currentScreen = Screen.MainFeed }
                )
            }
            is Screen.Posting -> {
                PostingScreen(
                    onCancel = { currentScreen = Screen.MainFeed },
                    onPostSuccess = {
                        currentScreen = Screen.MainFeed
                    }
                )
            }
        }
    }
}