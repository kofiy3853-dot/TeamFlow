package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    secondary = DarkSecondary,
    tertiary = DarkTertiary,
    background = DarkBackground,
    surface = DarkSurface,
    onPrimary = DarkOnPrimary,
    onBackground = DarkOnBackground,
    onSurface = DarkOnSurface
)

private val LightColorScheme = lightColorScheme(
    primary = WorkspacePrimary,
    secondary = WorkspaceSecondary,
    tertiary = WorkspaceTertiary,
    background = WorkspaceBackground,
    surface = WorkspaceSurface,
    onPrimary = WorkspaceOnPrimary,
    onBackground = WorkspaceOnBackground,
    onSurface = WorkspaceOnSurface,
    outline = WorkspaceOutline,
    outlineVariant = WorkspaceOutline, // Fallback to Slate 200 for clean structural lines
    primaryContainer = WorkspaceSurface, // High geometric contrast headers
    secondaryContainer = WorkspaceOutlineVariant // Slate 100 for subtle focus backgrounds
)

@Composable
fun TeamFlowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Sticky with custom premium palette
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
