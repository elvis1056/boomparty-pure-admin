# 個人待辦筆記

---

## 🗄️ 清除 NAS Postgre mock 資料

**時間：** 2026-03-09
**背景：** 為測試購物車功能，直接用 SQL 將 mockProducts / mockCategories 資料插入 NAS 上的 PostgreSQL。

**完成條件：** boomparty-admin 的商品管理、分類管理功能上線後再執行。

**清除步驟：**

```bash
# 1. SSH 進 NAS
# 2. 找到 postgres container
sudo docker ps --format "table {{.Names}}\t{{.Image}}" | grep postgres

# 3. 進入 psql
sudo docker exec -it <container_name> psql -U dbuser -d boomparty
```

```sql
-- 4. 依 FK 順序清除（順序不能錯）
TRUNCATE TABLE cart_item CASCADE;
TRUNCATE TABLE order_item CASCADE;
TRUNCATE TABLE product CASCADE;
TRUNCATE TABLE category CASCADE;
```

之後透過後台 UI 重新新增正式分類與商品資料。
