import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mr Hamburguesa — Panel",
  description: "ERP ligero para hamburguesería",
  manifest: "/manifest.json",
  themeColor: "#e98631"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">🍔 Mr Hamburguesa — Panel</h1>
              <nav className="flex gap-2 text-sm">
                <a className="btn" href="/">Dashboard</a>
                <form action="/api/auth/logout" method="post">
                  <button className="btn" formMethod="post">Salir</button>
                </form>
              </nav>
            </div>

            {/* Barra de navegación completa */}
            <nav className="flex flex-wrap gap-2 text-sm">
              <a className="btn" href="/inventario">Inventario</a>
              <a className="btn" href="/proveedores">Proveedores</a>
              <a className="btn" href="/compras">Compras</a>
              <a className="btn" href="/recetas">Recetas</a>
              <a className="btn" href="/ventas">Ventas</a>
              <a className="btn" href="/faltantes">Faltantes</a>
              <a className="btn" href="/ajustes">Ajustes</a>
              <a className="btn" href="/conteo">Conteo físico</a>
              <a className="btn" href="/pos">POS</a>
              <a className="btn" href="/cierre">Cierre Caja</a>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  )
}
