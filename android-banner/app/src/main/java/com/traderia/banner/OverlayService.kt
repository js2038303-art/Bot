package com.traderia.banner

import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Button

class OverlayService : Service() {
    private lateinit var wm: WindowManager
    private var root: LinearLayout? = null
    private var expanded = true
    private lateinit var params: WindowManager.LayoutParams

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (root == null) showOverlay()
        return START_STICKY
    }

    private fun bg(color: Int, stroke: Int = Color.TRANSPARENT, radius: Float = 20f): GradientDrawable =
        GradientDrawable().apply {
            setColor(color); cornerRadius = radius
            if (stroke != Color.TRANSPARENT) setStroke(2, stroke)
        }

    private fun label(text: String, size: Float, color: Int, bold: Boolean = false): TextView =
        TextView(this).apply {
            this.text = text; textSize = size; setTextColor(color)
            if (bold) setTypeface(null, Typeface.BOLD)
            setPadding(10, 7, 10, 7)
        }

    private fun row(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
    }

    private fun showOverlay() {
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        params = WindowManager.LayoutParams(
            (resources.displayMetrics.widthPixels * 0.68f).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = 18; y = (resources.displayMetrics.heightPixels * 0.25f).toInt()
        }
        root = buildPanel()
        wm.addView(root, params)
    }

    private fun buildPanel(): LinearLayout {
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(12, 12, 12, 12)
            background = bg(Color.rgb(7, 8, 15), Color.rgb(0, 190, 135), 24f)
            elevation = 18f
        }

        val header = row()
        header.addView(label("TRADER IA", 17f, Color.rgb(0, 220, 160), true),
            LinearLayout.LayoutParams(0, -2, 1f))
        val close = label("−", 25f, Color.WHITE, true).apply {
            gravity = Gravity.CENTER
            setOnClickListener { togglePanel() }
        }
        header.addView(close)
        panel.addView(header)

        val stats = row().apply { setPadding(0, 10, 0, 8) }
        val win = label("WIN     1", 15f, Color.rgb(0, 225, 160), true).apply {
            background = bg(Color.rgb(0, 42, 35), Color.rgb(0, 120, 90), 30f)
            gravity = Gravity.CENTER
        }
        val loss = label("LOSS     0", 15f, Color.rgb(255, 95, 105), true).apply {
            background = bg(Color.rgb(48, 13, 22), Color.rgb(125, 35, 48), 30f)
            gravity = Gravity.CENTER
        }
        stats.addView(win, LinearLayout.LayoutParams(0, -2, 1f))
        stats.addView(View(this), LinearLayout.LayoutParams(8, 1))
        stats.addView(loss, LinearLayout.LayoutParams(0, -2, 1f))
        panel.addView(stats)

        panel.addView(label("+R$ 164,00                         100%", 17f,
            Color.rgb(0, 220, 160), true))
        panel.addView(label("Última entrada: WIN       +R$ 164,00", 13f,
            Color.rgb(0, 220, 160), true).apply {
                background = bg(Color.rgb(0, 39, 33), Color.TRANSPARENT, 24f)
            })

        val signal = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(12, 12, 12, 12)
            background = bg(Color.rgb(4, 35, 31), Color.rgb(0, 150, 105), 22f)
        }
        signal.addView(label("↗  AGUARDANDO ANÁLISE", 18f, Color.rgb(0, 225, 160), true))
        signal.addView(label("VENCE EM                         --:--", 14f, Color.LTGRAY))
        val bar = View(this).apply { background = bg(Color.rgb(0, 205, 145), radius = 12f) }
        signal.addView(bar, LinearLayout.LayoutParams(-1, 9))
        panel.addView(signal)

        val analyze = Button(this).apply {
            text = "ANALISAR GRÁFICO"
            textSize = 16f
            setTextColor(Color.BLACK)
            typeface = Typeface.DEFAULT_BOLD
            background = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(Color.rgb(170, 55, 255), Color.rgb(255, 170, 0))
            ).apply { cornerRadius = 28f }
            setOnClickListener {
                text = "ANÁLISE NÃO CONECTADA"
                isEnabled = false
            }
        }
        val buttonParams = LinearLayout.LayoutParams(-1, 58)
        buttonParams.topMargin = 12
        panel.addView(analyze, buttonParams)

        val note = label("Painel visual • conexão com análise ainda pendente", 10f,
            Color.GRAY).apply { gravity = Gravity.CENTER }
        panel.addView(note)
        panel.setOnTouchListener(object : View.OnTouchListener {
            var sx = 0f; var sy = 0f; var ox = 0; var oy = 0
            override fun onTouch(v: View, e: MotionEvent): Boolean {
                when (e.action) {
                    MotionEvent.ACTION_DOWN -> { sx=e.rawX; sy=e.rawY; ox=params.x; oy=params.y; return true }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = ox + (sx-e.rawX).toInt()
                        params.y = oy + (e.rawY-sy).toInt()
                        wm.updateViewLayout(panel, params); return true
                    }
                }
                return false
            }
        })
        return panel
    }

    private fun togglePanel() {
        root?.let { wm.removeView(it) }
        if (expanded) {
            val bubble = TextView(this).apply {
                text = "IA"; textSize = 18f; setTextColor(Color.WHITE)
                gravity = Gravity.CENTER; background = bg(Color.rgb(0, 120, 95), Color.WHITE, 60f)
                setOnClickListener { expanded = true; root = buildPanel(); wm.addView(root, params) }
            }
            params.width = 62; params.height = 62
            root = LinearLayout(this).apply { addView(bubble, LinearLayout.LayoutParams(62,62)) }
            expanded = false
        } else {
            params.width = (resources.displayMetrics.widthPixels * 0.68f).toInt()
            params.height = WindowManager.LayoutParams.WRAP_CONTENT
            root = buildPanel(); expanded = true
        }
        wm.addView(root, params)
    }

    override fun onDestroy() {
        root?.let { try { wm.removeView(it) } catch (_: Exception) {} }
        root = null
        super.onDestroy()
    }
}
