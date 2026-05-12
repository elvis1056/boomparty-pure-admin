---
description: Use when debugging NAS deployment or Docker issues
---

# NAS 部署 Troubleshooting

## macOS `._*` AppleDouble 檔案導致 Docker build 失敗

**症狀**：`pnpm build` 在 Docker 內失敗，錯誤訊息類似：

```
Utf8Error { valid_up_to: 45, error_len: Some(1) }
```

Tailwind v4 oxide（Rust 引擎）掃描到 `._*.vue` 等 binary 檔案，無法解析 UTF-8 而 panic。

**原因**：macOS 用 zip/tar 打包時會產生 `._*` companion 檔案（AppleDouble 格式），解壓縮到 NAS 後殘留在 `src/` 目錄。

**確認數量**：

```bash
sudo find /var/services/homes/nasweb/boomparty-pure-admin -name "._*" | wc -l
```

**清除指令**：

```bash
sudo find /var/services/homes/nasweb/boomparty-pure-admin -name "._*" -delete
```

**預防措施**（已設定）：

- `.dockerignore` 已加入 `._*` — Docker build context 不含這些檔案
- 打包時用 `COPYFILE_DISABLE=1 tar czf ...` 可避免產生 `._*`

---

## nginx 403 Permission Denied

**症狀**：admin.boomparty.tw 出現 403 Forbidden，NAS log 顯示 `Permission denied (13)`

**原因**：Docker COPY 複製的靜態檔案權限為 `rwx--x--x`（711），nginx worker（非 root）無法讀取。

**臨時修復**（不重 build）：

```bash
sudo docker exec boomparty-admin chmod -R 755 /usr/share/nginx/html
```

**永久修復**（已寫入 Dockerfile）：

```dockerfile
RUN chmod -R 755 /usr/share/nginx/html
```

---

## PostgreSQL 使用者管理

以下指令在 NAS 上透過 SSH 執行。

**查詢所有使用者**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "SELECT id, username, role FROM users;"
```

**產生 BCrypt hash**（macOS）：

```bash
htpasswd -bnBC 10 "" <your-password> | tr -d ":\n" | sed 's/$2y/$2a/'
```

**新增使用者**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "INSERT INTO users (username, email, password, full_name, phone_number, role, enabled, created_at, updated_at) VALUES ('<username>', '<email>', '<bcrypt-hash>', '<full-name>', '<phone>', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);"
```

**更新 role**：

```bash
sudo docker exec boomparty-postgres psql -U dbuser -d boomparty -c "UPDATE users SET role = 'ADMIN' WHERE username = '<username>';"
```
