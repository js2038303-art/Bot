package com.traderia.banner

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.graphics.Color
import android.view.Gravity

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(28, 28, 28, 28)
            setBackgroundColor(Color.rgb(8, 13, 24))
        }
        val title = TextView(this).apply {
            text = "TRADER IA"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        val info = TextView(this).apply {
            text = "Ative a permissão de sobreposição para exibir o painel flutuante sobre a Pocket Option."
            textSize = 16f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(0, 22, 0, 22)
        }
        val button = Button(this).apply {
            text = "ATIVAR BANNER FLUTUANTE"
            setOnClickListener {
                if (!Settings.canDrawOverlays(this@MainActivity)) {
                    startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")))
                } else {
                    startService(Intent(this@MainActivity, OverlayService::class.java))
                    finish()
                }
            }
        }
        layout.addView(title)
        layout.addView(info)
        layout.addView(button)
        setContentView(layout)
    }

    override fun onResume() {
        super.onResume()
        if (Settings.canDrawOverlays(this)) {
            // O usuário pode tocar novamente no botão para iniciar o painel.
        }
    }
}
