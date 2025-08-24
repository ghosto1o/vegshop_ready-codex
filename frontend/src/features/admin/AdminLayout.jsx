import React from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout as doLogout } from '../../api/auth.js'

export default function AdminLayout(){
  const loc = useLocation()
  const nav = useNavigate()
  const tab = loc.pathname.split('/')[2] || 'products'
  return (
    <div>
      <div className="header admin-header">
        <div className="container admin-header-inner">
          <nav className="admin-nav">
            <Link to="/admin/products" className={tab==='products'?'active':''}>🥦 สินค้า</Link>
            <Link to="/admin/orders" className={tab==='orders'?'active':''}>📦 คำสั่งซื้อ</Link>
            <Link to="/admin/buyers" className={tab==='buyers'?'active':''}>👤 ผู้ซื้อ</Link>
          </nav>
          <div className="admin-actions">
            <Link to="/" className="btn">🏠 หน้าหลัก</Link>
            <button
              className="btn"
              onClick={()=>{ console.log('[FE] admin logout click'); doLogout(); nav('/'); location.reload() }}
            >ออกจากระบบ</button>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
