import './globals.css'
export const metadata = { title:'Mr Hamburguesa — Panel', description:'ERP ligero' }
export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="es"><body><div className="max-w-6xl mx-auto p-6">
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">🍔 Mr Hamburguesa — Panel</h1>
      <nav className="flex gap-2 text-sm">
        <a className="btn" href="/">Dashboard</a>
        <a className="btn" href="/inventario">Inventario</a>
        <a className="btn" href="/proveedores">Proveedores</a>
        <a className="btn" href="/compras">Compras</a>
      </nav>
    </header>{children}</div></body></html>)
}