import path from "path"
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import path from 'path'
=======
import { defineConfig } from 'vite'
>>>>>>> ada522895db17382558e1210d4ac6962414f9051

export default defineConfig({
<<<<<<< HEAD
  plugins: [react()],
=======
  plugins: [react(), tailwindcss()],
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
<<<<<<< HEAD
})
=======
})
>>>>>>> ada522895db17382558e1210d4ac6962414f9051
