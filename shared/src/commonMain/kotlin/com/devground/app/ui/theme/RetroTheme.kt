package com.devground.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import devground.shared.generated.resources.Res
import devground.shared.generated.resources.galmuri11
import org.jetbrains.compose.resources.Font

val RetroGreen = Color(0xFF00FF41)
val RetroDarkBg = Color(0xFF0D0208)
val RetroSurface = Color(0xFF141414)
val RetroBorder = Color(0xFF008F11)

private val RetroColorScheme = darkColorScheme(
    primary = RetroGreen,
    onPrimary = RetroDarkBg,
    primaryContainer = RetroBorder,
    onPrimaryContainer = Color.White,
    secondary = RetroGreen,
    onSecondary = RetroDarkBg,
    background = RetroDarkBg,
    onBackground = RetroGreen,
    surface = RetroSurface,
    onSurface = RetroGreen,
    error = Color(0xFFFF003C),
    onError = Color.White
)

@Composable
fun RetroTheme(content: @Composable () -> Unit) {
    val galmuriFont = FontFamily(Font(Res.font.galmuri11))
    
    val retroTypography = Typography(
        displayLarge = TextStyle(fontFamily = galmuriFont, fontSize = 57.sp),
        displayMedium = TextStyle(fontFamily = galmuriFont, fontSize = 45.sp),
        displaySmall = TextStyle(fontFamily = galmuriFont, fontSize = 36.sp),
        headlineLarge = TextStyle(fontFamily = galmuriFont, fontSize = 32.sp),
        headlineMedium = TextStyle(fontFamily = galmuriFont, fontSize = 28.sp),
        headlineSmall = TextStyle(fontFamily = galmuriFont, fontSize = 24.sp),
        titleLarge = TextStyle(fontFamily = galmuriFont, fontSize = 22.sp),
        titleMedium = TextStyle(fontFamily = galmuriFont, fontSize = 16.sp),
        titleSmall = TextStyle(fontFamily = galmuriFont, fontSize = 14.sp),
        bodyLarge = TextStyle(fontFamily = galmuriFont, fontSize = 16.sp),
        bodyMedium = TextStyle(fontFamily = galmuriFont, fontSize = 14.sp),
        bodySmall = TextStyle(fontFamily = galmuriFont, fontSize = 12.sp),
        labelLarge = TextStyle(fontFamily = galmuriFont, fontSize = 14.sp),
        labelMedium = TextStyle(fontFamily = galmuriFont, fontSize = 12.sp),
        labelSmall = TextStyle(fontFamily = galmuriFont, fontSize = 11.sp)
    )

    MaterialTheme(
        colorScheme = RetroColorScheme,
        typography = retroTypography,
        content = content
    )
}
