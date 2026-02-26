#!/bin/bash

# Renkli mesajlar için tanımlamalar
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 KariyerMUDU GitHub Senkronizasyonu Başlıyor...${NC}"

# 1. Uzak sunucu (remote) kontrolü
REMOTE_CHECK=$(git remote -v)
if [ -z "$REMOTE_CHECK" ]; then
    echo -e "${YELLOW}⚠️  Henüz bir GitHub bağlantısı bulunamadı.${NC}"
    echo -e "Lütfen GitHub üzerinde oluşturduğunuz boş reponun URL'sini girin:"
    echo -e "(Örnek: https://github.com/kullaniciadi/reponame.git)"
    read GITHUB_URL
    
    if [ -z "$GITHUB_URL" ]; then
        echo -e "${RED}❌ URL girilmedi, işlem iptal edildi.${NC}"
        exit 1
    fi
    
    git remote add origin "$GITHUB_URL"
    git branch -M main
    echo -e "${GREEN}✅ GitHub bağlantısı eklendi.${NC}"
fi

# 2. Değişiklikleri ekle
echo -e "${BLUE}📦 Dosyalar hazırlanıyor...${NC}"
git add .

# 3. Commit oluştur (Tarih ve saat ile)
TIMESTAMP=$(date +"%d-%m-%Y %H:%M:%S")
echo -e "${BLUE}✍️  Değişiklikler kaydediliyor...${NC}"
git commit -m "Güncelleme: $TIMESTAMP"

# 4. Push işlemi
echo -e "${BLUE}📤 GitHub'a gönderiliyor...${NC}"
CHECK_BRANCH=$(git branch --show-current)
git push -u origin "$CHECK_BRANCH"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✨ TEBRİKLER! Tüm dosyalarınız GitHub'a başarıyla atıldı.${NC}"
    echo -e "${GREEN}🔗 Siteniz Vercel'e bağlıysa otomatik olarak güncellenecektir.${NC}"
else
    echo -e "\n${RED}❌ Bir hata oluştu. Lütfen internet bağlantınızı ve GitHub yetkilerinizi kontrol edin.${NC}"
fi
