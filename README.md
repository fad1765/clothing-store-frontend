# Clothing-Store 前端專案

使用 React + Vite 建置的完整電商前端專案，支援商品瀏覽、分類、購物車、會員登入註冊、願望清單與後台管理功能。專案架構採用 SPA 設計，並可透過 `.env` 串接後端 API。

## 主要功能

- 首頁展示：輪播圖、公告跑馬燈、熱門商品、限時商品
- 商品分類：衣服、褲子、襪子
- 商品列表：排序、分頁、快速瀏覽
- 商品詳情彈窗：多圖展示、留言評論、評分、收藏、加入購物車
- 購物車：訪客 localStorage 暫存、會員購物車同步   
- 會員系統：登入 / 註冊、權限驗證、後台路由保護
- 願望清單與我的訂單頁面
- 後台管理：商品管理、訂單管理、使用者管理、優惠券管理
- 管理員儀表板（Baseboard）：即時營運與商品監控儀表板，包含銷售概況、庫存警示、熱門商品與關鍵 KPI

## 技術

- React 18
- Vite
- React Router DOM
- Context API
- framer-motion
- react-icons
- ESLint

## 專案結構

- `src/App.jsx`：應用路由與全域佈局配置
- `src/main.jsx`：React 應用入口 
- `src/layout/`：`Layout`、`Header`、`Sidebar`、`Footer` 等主要頁面佈局
- `src/pages/`：首頁、分類頁、購物車、登入、我的訂單、管理後台等頁面
- `src/components/`：可重用元件，例如 `ProductCard`、`ProductModal`、`CartDrawer`、`Slider`、模態視窗
- `src/context/`：狀態管理，包含 `AuthProvider`、`CartProvider` 等
- `src/styles/`：各頁面與元件 CSS

## 主要路由

- `/`：首頁
- `/clothing`：衣服分類
- `/pants`：褲子分類
- `/socks`：襪子分類
- `/cart`：購物車頁面
- `/login`：登入 / 註冊頁面
- `/wishlist`：願望清單
- `/products`：商品總覽
- `/orders`：我的訂單
- `/admin`：後台首頁（需管理員權限）
- `/admin/products`：後台商品管理
- `/admin/orders`：後台訂單管理
- `/admin/users`：後台使用者管理
- `/admin/coupons`：後台優惠券管理

## 環境變數

專案使用 `.env` 設定後端 API 基礎網址：

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 安裝與執行

```bash
npm install
npm run dev
```

開啟後會在瀏覽器啟動 Vite 開發伺服器。

## 建置與預覽

```bash
npm run build
npm run preview
```

## 可用指令

- `npm run dev`：啟動開發伺服器
- `npm run build`：產生生產環境靜態檔案
- `npm run preview`：本地預覽建置內容
- `npm run lint`：執行 ESLint 靜態檢查

## 後端 API 需求

此前端專案需搭配後端 API 使用，主要呼叫接口如下：

- `GET /products`
- `GET /products/:id/comments`
- `GET /cart/:userId`
- `POST /cart`
- `GET /wishlist/check?user_id=...&product_id=...`
- `POST /wishlist`
- `DELETE /wishlist`
- `POST /users/login`
- `POST /users/register`
- `GET /coupons/marquee`

後端資料格式應包含商品圖片、分類、價格、評分、留言、使用者資料等。

## 會員與後台管理

- 會員登入資訊會儲存在 `localStorage`
- `CartProvider` 會自動同步會員購物車與訪客購物車
- 管理員專區由 `RequireAdmin` 保護，需判斷後端帳號角色
- 登入頁面提示管理員帳號：`admin@admin` / `123456`

## 專案特色

- 完整電商前端體驗：商品瀏覽、購物車、會員系統、後台管理
- 使用 Context API 管理全域狀態
- 支援商品排序、分頁、評論、收藏、多圖展示
- 可與後端 API 串接，具備可擴充性
- 採用元件化架構，提升維護與可重用性
- 內建管理員 Baseboard 儀表板，提供即時營運指標與商品健康檢視，利於快速決策與監控

## 示意圖（Screenshots）

下面為專案主要頁面截圖（檔案位於 `public/images/`），僅標示對應頁面：

- `public/images/homepage.png` — 首頁
- `public/images/clothes.png` — 衣服分類頁
- `public/images/productmodal.png` — 商品詳情Modal
- `public/images/cart.png` — 購物車
- `public/images/myorder.png` — 我的訂單
- `public/images/mycollect.png` — 我的收藏
- `public/images/products.png` — 商品總覽(後台)
- `public/images/orders.png` — 訂單管理（後台）
- `public/images/coupons.png` — 優惠券(後台)
- `public/images/baseboard.png` — 管理員 Baseboard 儀表板(後台)