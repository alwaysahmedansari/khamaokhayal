# خامہ و خیال

عوام کے لیے لاگ اِن نہیں۔ کوئی بھی پڑھ سکتا ہے اور تحریر بھیج سکتا ہے۔ شائع صرف ایڈمن کرتا ہے۔

**تمام فائلیں ایک ہی سطح (مین روٹ) پر ہیں، کوئی فولڈر نہیں بنانا۔**

## GitHub پر لگانے کا طریقہ (فون سے)
1. زپ کھول کر اس کی تمام فائلیں ریپوزٹری میں اپلوڈ کریں (Add file ← Upload files)۔ `jameel.woff` بھی۔
2. Settings ← Pages ← Deploy from a branch ← `main` / `(root)`۔
3. (اختیاری مگر بہتر) keep-alive: Add file ← Create new file، نام میں `.github/workflows/keep-alive.yml` لکھیں اور `keep-alive.yml` کا متن پیسٹ کریں۔ GitHub فولڈر خود بنا دے گا۔

## Supabase (صرف پہلی بار)
1. SQL Editor ← `supabase.sql` پورا پیسٹ کر کے Run کریں۔ (اگر پہلے چلا چکے ہیں تو دوبارہ نہ چلائیں۔)
2. Authentication ← Users ← Add user سے اپنا ایڈمن اکاؤنٹ بنائیں، پھر `supabase.sql` کی آخری `insert into admins ...` سطر اپنی ای میل کے ساتھ چلائیں۔
3. Authentication ← Sign In / Providers میں "Allow new users to sign up" بند کریں۔
4. ایڈمن پینل: `admin.html`

## نوٹ
- `config.js` میں صرف publishable key رہے۔ secret یا service_role key کبھی نہ ڈالیں۔
- پبلک ریپو میں 60 دن سرگرمی نہ ہو تو GitHub شیڈول بند کر دیتا ہے۔ Actions میں keep-alive دوبارہ چلا دیں۔
- فونٹ تقریباً 6.8 MB ہے، پہلی بار لوڈ ہونے میں وقت لگ سکتا ہے۔
- سپیم آئے تو بعد میں Cloudflare Turnstile لگا سکتے ہیں۔
