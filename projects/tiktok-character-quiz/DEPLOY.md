# Deploy HTML Quiz - Hướng Dẫn Nhanh

## Quiz Files
- **File chính:** `index.html` (single-file, ~21KB)
- **Preview:** Mở file trong trình duyệt để test

## Cách Deploy Đơn Giản Nhất

### Cách 1: Netlify (Miễn Phí, Nhanh Nhất) - 2 PHÚT

**Bước 1:** Truy cập https://netlify.com/dragdrop

**Bước 2:** Kéo thả folder `tiktok-character-quiz` vào trang

**Bước 3:** Done! Netlify sẽ cung cấp URL như `https://random-name.netlify.app`

**Hoặc qua CLI:**
```bash
npm install -g netlify-cli
cd tiktok-character-quiz
netlify deploy --prod
```

---

### Cách 2: Vercel (Miễn Phí)

**Bước 1:** Truy cập https://vercel.com/new

**Bước 2:** Import từ GitHub hoặc kéo thả folder

**Hoặc qua CLI:**
```bash
npm install -g vercel
cd tiktok-character-quiz
vercel --prod
```

---

### Cách 3: GitHub Pages (Miễn Phí)

**Bước 1:** Push code lên GitHub repo

**Bước 2:** Settings > Pages > Source: main branch

**Bước 3:** URL sẽ là `https://username.github.io/repo-name/`

---

### Cách 4: Cloudflare Pages (Miễn Phí)

**Bước 1:** Truy cập https://pages.cloudflare.com/

**Bước 2:** Kết nối GitHub repo hoặc kéo thả

---

## Sau Khi Deploy

1. **Test URL** trên điện thoại TikTok (in-app browser)
2. **Chia sẻ link** cho người dùng
3. **Thêm vào TikTok bio** để tăng traffic

## Tích Hợp TikTok

### Cách 1: Share Link
Chia sẻ trực tiếp URL của quiz

### Cách 2: QR Code
Tạo QR code từ URL để dán vào TikTok video

### Cách 3: Link in Bio
Thêm link quiz vào bio TikTok

## Cấu Hình Tên Miền Tùy Chỉnh (Optional)

Sau khi deploy, bạn có thể:
1. Mua domain (VD: `quizcủa.tôi`)
2. Point domain về Netlify/Vercel
3. SSL được enable tự động

---

## Troubleshooting

**Quiz không hiển thị đúng trên TikTok mobile?**
→ Dùng in-app browser test, không phải external browser

**Animation bị lag?**
→ Thử tắt một số transitions trong CSS

**Font không hiển thị?**
→ Kiểm tra font loading trong `<head>`
