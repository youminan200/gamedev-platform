package com.devground.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.devground.app.api.ApiClient
import com.devground.app.models.DevLogCreateRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostingScreen(onCancel: () -> Unit, onPostSuccess: () -> Unit, modifier: Modifier = Modifier) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var isPosting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New DevLog") },
                navigationIcon = {
                    Button(onClick = onCancel, modifier = Modifier.padding(start = 8.dp), enabled = !isPosting) {
                        Text("Cancel")
                    }
                }
            )
        },
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Title") },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isPosting
            )
            
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                label = { Text("Content") },
                modifier = Modifier.fillMaxWidth().weight(1f),
                enabled = !isPosting
            )
            
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        isPosting = true
                        scope.launch {
                            try {
                                ApiClient.postDevLog(
                                    DevLogCreateRequest(
                                        title = title,
                                        author = "Youmi", // Hardcoded for now
                                        tags = listOf("New", "DevLog")
                                    )
                                )
                                onPostSuccess()
                            } catch (e: Exception) {
                                isPosting = false
                            }
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isPosting
            ) {
                if (isPosting) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Post DevLog")
                }
            }
        }
    }
}
