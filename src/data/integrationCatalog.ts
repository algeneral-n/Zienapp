// ═══════════════════════════════════════════════════════════════
//  ZIEN AI — Full Integration Catalog
//  36 integrations across 7 categories
//  All pricing in AED/month
// ═══════════════════════════════════════════════════════════════

export interface IntegrationPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    limit: string;
    features: string[];
}

export interface Integration {
    id: string;
    name: string;
    logo: string | null;
    description: string;
    website: string;
    category: string;
    plans: IntegrationPlan[];
    requiredPlan: string;
    features: string[];
    setupFields: string[];
}

export interface IntegrationGroup {
    id: string;
    name: string;
    nameEn: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    integrations: Integration[];
}

export const INTEGRATION_GROUPS: IntegrationGroup[] = [
    // ── 1. Payment Systems ────────────────────────────────────────
    {
        id: 'payment',
        name: 'أنظمة الدفع',
        nameEn: 'Payment Systems',
        icon: 'CreditCard',
        color: 'from-blue-600 to-indigo-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        integrations: [
            {
                id: 'stripe',
                name: 'Stripe',
                logo: 'https://cdn.simpleicons.org/stripe/635BFF',
                description: 'بوابة الدفع العالمية الأكثر موثوقية. يدعم بطاقات الائتمان وGoogle Pay وApple Pay وأكثر من 135 عملة.',
                website: 'https://stripe.com',
                category: 'payment',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 49, currency: 'AED', limit: 'مدفوعات فقط', features: ['معالجة مدفوعات فورية', 'دعم 135+ عملة', 'اشتراكات متكررة'] },
                    { id: 'standard', name: 'معياري', price: 129, currency: 'AED', limit: 'مدفوعات + فواتير', features: ['كل الأساسي', 'فواتير تلقائية', 'Stripe Connect'] },
                    { id: 'premium', name: 'متميز', price: 299, currency: 'AED', limit: 'كاملة', features: ['API كامل', 'Stripe Radar', 'Custom Reports'] },
                ],
                requiredPlan: 'starter',
                features: ['معالجة مدفوعات فورية', 'دعم 135+ عملة', 'اشتراكات متكررة'],
                setupFields: ['publishable_key', 'secret_key', 'webhook_secret'],
            },
            {
                id: 'tabby',
                name: 'Tabby',
                logo: 'https://cdn.brandfetch.io/id-WvX5pKT/w/400/h/400/theme/dark/icon.jpeg?c=1id-WvX5pKT',
                description: 'منصة الشراء الآن والدفع لاحقاً الرائدة في الشرق الأوسط. تقسيم المدفوعات إلى 4 أقساط بدون فوائد.',
                website: 'https://tabby.ai',
                category: 'payment',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 79, currency: 'AED', limit: 'BNPL فقط', features: ['بدون فوائد BNPL', 'تقسيم 4-6 أقساط', 'تغطية الإمارات والسعودية'] },
                    { id: 'standard', name: 'معياري', price: 179, currency: 'AED', limit: 'BNPL + تحليلات', features: ['كل الأساسي', 'تحليلات مبيعات', 'Widget مخصص'] },
                    { id: 'premium', name: 'متميز', price: 349, currency: 'AED', limit: 'كاملة', features: ['API مخصص', 'تقارير متقدمة', 'حد ائتماني مرتفع'] },
                ],
                requiredPlan: 'business',
                features: ['بدون فوائد BNPL', 'تقسيم 4-6 أقساط', 'تغطية الإمارات والسعودية'],
                setupFields: ['merchant_code', 'secret_key'],
            },
            {
                id: 'tamara',
                name: 'Tamara',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Tamara_logo.svg/512px-Tamara_logo.svg.png',
                description: 'السعودي الرائد. الدفع الآن أو لاحقاً أو بالتقسيط BNPL حل مع ضمان الحماية الكاملة للتاجر.',
                website: 'https://tamara.co',
                category: 'payment',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 89, currency: 'AED', limit: 'BNPL فقط', features: ['يغطي السعودية والإمارات والكويت', '100% حماية التاجر', 'موافقة فورية للمشترين'] },
                    { id: 'standard', name: 'معياري', price: 199, currency: 'AED', limit: 'BNPL + تحليلات', features: ['كل الأساسي', 'لوحة التاجر', 'Webhooks'] },
                    { id: 'premium', name: 'متميز', price: 399, currency: 'AED', limit: 'كاملة', features: ['API كامل', 'تسويات مخصصة', 'AR Portal'] },
                ],
                requiredPlan: 'business',
                features: ['يغطي السعودية والإمارات والكويت', '100% حماية التاجر', 'موافقة فورية للمشترين'],
                setupFields: ['merchant_token', 'notification_token'],
            },
            {
                id: 'telr',
                name: 'Telr',
                logo: 'https://www.google.com/s2/favicons?domain=telr.com&sz=128',
                description: 'بوابة دفع إقليمية متكاملة. تدعم أكثر من 120 عملة مع الامتثال PCI DSS لأقصى أمان.',
                website: 'https://telr.com',
                category: 'payment',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 59, currency: 'AED', limit: 'بوابة دفع', features: ['PCI DSS', 'بوابة دفع', 'دعم 120+ عملة'] },
                    { id: 'standard', name: 'معياري', price: 149, currency: 'AED', limit: 'بوابة + فواتير', features: ['كل الأساسي', 'اشتراكات', 'الفواتير'] },
                    { id: 'premium', name: 'متميز', price: 299, currency: 'AED', limit: 'كاملة', features: ['Hosted Pages', 'Split Payments', 'API كامل'] },
                ],
                requiredPlan: 'starter',
                features: ['PCI DSS', 'بوابة دفع', 'دعم 120+ عملة'],
                setupFields: ['store_id', 'auth_key'],
            },
            {
                id: 'paypal',
                name: 'PayPal',
                logo: 'https://cdn.simpleicons.org/paypal/003087',
                description: 'المحفظة الرقمية العالمية الأكثر انتشاراً أكثر من 400 مليون مستخدم في 200 دولة.',
                website: 'https://paypal.com',
                category: 'payment',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 39, currency: 'AED', limit: 'مدفوعات فقط', features: ['400M+ مستخدم', 'سلامة المشتري بالدفع', 'مدفوعات فورية'] },
                    { id: 'standard', name: 'معياري', price: 99, currency: 'AED', limit: 'مدفوعات + فواتير', features: ['كل الأساسي', 'فواتير', 'Subscriptions'] },
                    { id: 'premium', name: 'متميز', price: 229, currency: 'AED', limit: 'كاملة', features: ['API كامل', 'PayPal Commerce', '200+ دولة'] },
                ],
                requiredPlan: 'starter',
                features: ['400M+ مستخدم', 'سلامة المشتري بالدفع', 'مدفوعات فورية'],
                setupFields: ['client_id', 'client_secret'],
            },
        ],
    },

    // ── 2. Digital Advertising ────────────────────────────────────
    {
        id: 'advertising',
        name: 'الإعلانات الرقمية',
        nameEn: 'Digital Advertising',
        icon: 'Megaphone',
        color: 'from-purple-600 to-pink-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        integrations: [
            {
                id: 'meta-ads',
                name: 'Meta Ads',
                logo: 'https://cdn.simpleicons.org/meta/0081FB',
                description: 'الإعلانات على فيسبوك وإنستغرام. إزالة ملقات Custom Audiences, Pixel, Conversions API.',
                website: 'https://business.facebook.com',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 99, currency: 'AED', limit: 'إعلانات أساسية', features: ['Meta Pixel', 'Conversions API (CAPI)', 'Custom Audiences في CRM'] },
                    { id: 'standard', name: 'معياري', price: 249, currency: 'AED', limit: 'إعلانات + تحسين', features: ['كل الأساسي', 'تحسين تلقائي', 'Lookalike Audiences'] },
                    { id: 'premium', name: 'متميز', price: 499, currency: 'AED', limit: 'كاملة', features: ['Server-Side Events', 'Catalogs API', 'AI Optimization'] },
                ],
                requiredPlan: 'business',
                features: ['Meta Pixel', 'Conversions API (CAPI)', 'Custom Audiences في CRM'],
                setupFields: ['pixel_id', 'access_token', 'app_id', 'app_secret'],
            },
            {
                id: 'google-ads',
                name: 'Google Ads',
                logo: 'https://cdn.simpleicons.org/googleads/4285F4',
                description: 'إعلانات Google بما في ذلك Search، Shopping، Performance Max. Smart Bidding بأهداف محسّنة.',
                website: 'https://ads.google.com',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 89, currency: 'AED', limit: 'تتبع أساسي', features: ['Search Campaigns', 'Display Networks', 'Shopping'] },
                    { id: 'standard', name: 'معياري', price: 229, currency: 'AED', limit: 'تتبع + تحسين', features: ['كل الأساسي', 'Performance Max', 'Smart Bidding'] },
                    { id: 'premium', name: 'متميز', price: 449, currency: 'AED', limit: 'كاملة', features: ['Offline Conversions', 'Value-Based Bidding', 'Attribution'] },
                ],
                requiredPlan: 'business',
                features: ['Search Campaigns', 'Display Networks', 'Shopping'],
                setupFields: ['customer_id', 'developer_token', 'client_id', 'client_secret'],
            },
            {
                id: 'youtube-ads',
                name: 'YouTube Ads',
                logo: 'https://cdn.simpleicons.org/youtube/FF0000',
                description: 'إعلانات الفيديو على يوتيوب أكبر 2 منصة. Stream, Bumper, Discovery. القياس والتحسين المستمر.',
                website: 'https://ads.google.com/intl/ar/home/campaigns/video-ads/',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 79, currency: 'AED', limit: 'إعلانات فيديو', features: ['In-Stream Ads المتقدمة', 'Non-skippable Ads', 'Bumper Ads 6 ثوان'] },
                    { id: 'standard', name: 'معياري', price: 199, currency: 'AED', limit: 'إعلانات + تحسين', features: ['كل الأساسي', 'Discovery Ads', 'Audience Targeting'] },
                    { id: 'premium', name: 'متميز', price: 399, currency: 'AED', limit: 'كاملة', features: ['Video Action Campaigns', 'Brand Lift', 'Cross-Network'] },
                ],
                requiredPlan: 'business',
                features: ['In-Stream Ads المتقدمة', 'Non-skippable Ads', 'Bumper Ads 6 ثوان'],
                setupFields: ['customer_id', 'developer_token'],
            },
            {
                id: 'tiktok-ads',
                name: 'TikTok Ads',
                logo: 'https://cdn.simpleicons.org/tiktok/000000',
                description: 'إعلانات TikTok أسرع منصة نمواً. أنواع إعلانات أصلية In-Feed, TopView, Brand Takeover, Branded Effects.',
                website: 'https://ads.tiktok.com',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 69, currency: 'AED', limit: 'إعلانات أساسية', features: ['In-Feed Video Ads', 'Spark Ads (UGC Boost)', 'TopView Ads'] },
                    { id: 'standard', name: 'معياري', price: 179, currency: 'AED', limit: 'إعلانات + تحسين', features: ['كل الأساسي', 'Branded Effects', 'Audience Insights'] },
                    { id: 'premium', name: 'متميز', price: 399, currency: 'AED', limit: 'كاملة', features: ['Brand Takeover', 'Conversions API', 'Catalog Sales'] },
                ],
                requiredPlan: 'business',
                features: ['In-Feed Video Ads', 'Spark Ads (UGC Boost)', 'TopView Ads'],
                setupFields: ['app_id', 'secret', 'pixel_code'],
            },
            {
                id: 'snapchat-ads',
                name: 'Snapchat Ads',
                logo: 'https://cdn.simpleicons.org/snapchat/FFFC00',
                description: 'إعلانات سناب شات. حملات Story Ads, AR Lenses, Dynamic Ads. الوصول إلى جمهور يصعب الوصول إليه.',
                website: 'https://forbusiness.snapchat.com',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 79, currency: 'AED', limit: 'إعلانات أساسية', features: ['Snap Ads من 30 ثانية', 'Story Ads', 'Collection Ads'] },
                    { id: 'standard', name: 'معياري', price: 189, currency: 'AED', limit: 'إعلانات + AR', features: ['كل الأساسي', 'AR Lenses', 'Audience Match'] },
                    { id: 'premium', name: 'متميز', price: 379, currency: 'AED', limit: 'كاملة', features: ['Dynamic Ads', 'Snap Pixel', 'Advanced Create'] },
                ],
                requiredPlan: 'professional',
                features: ['Snap Ads من 30 ثانية', 'Story Ads', 'Collection Ads'],
                setupFields: ['organization_id', 'access_token', 'pixel_id'],
            },
            {
                id: 'linkedin-ads',
                name: 'LinkedIn Ads',
                logo: 'https://cdn.simpleicons.org/linkedin/0A66C2',
                description: 'التسويق المهني B2B. إعلانات للأفراد الأهداف العليا. المحتوى المدعوم والرسائل المباشرة.',
                website: 'https://business.linkedin.com/marketing-solutions',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 99, currency: 'AED', limit: 'إعلانات أساسية', features: ['Sponsored Content', 'Single Image Ads', 'Video Ads'] },
                    { id: 'standard', name: 'معياري', price: 249, currency: 'AED', limit: 'إعلانات + InMail', features: ['كل الأساسي', 'Message Ads (InMail)', 'Lead Gen Forms'] },
                    { id: 'premium', name: 'متميز', price: 499, currency: 'AED', limit: 'كاملة', features: ['Conversation Ads', 'Matched Audiences', 'Revenue Attribution'] },
                ],
                requiredPlan: 'professional',
                features: ['Sponsored Content', 'Single Image Ads', 'Video Ads'],
                setupFields: ['client_id', 'client_secret', 'organization_urn'],
            },
            {
                id: 'x-ads',
                name: 'X (Twitter) Ads',
                logo: 'https://cdn.simpleicons.org/x/000000',
                description: 'إعلانات X تويتر. Promoted Tweets, Trends, إعلانات الفيديو التفاعلية. استهداف الاهتمامات والمحادثات.',
                website: 'https://ads.twitter.com',
                category: 'advertising',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 69, currency: 'AED', limit: 'إعلانات أساسية', features: ['Promoted Ads', 'Tailored Audiences', 'Website Conversions'] },
                    { id: 'standard', name: 'معياري', price: 179, currency: 'AED', limit: 'إعلانات + تحسين', features: ['كل الأساسي', 'Trend Takeover', 'Conversions API'] },
                    { id: 'premium', name: 'متميز', price: 349, currency: 'AED', limit: 'كاملة', features: ['Timeline Takeover', 'Brand Surveys', 'Dynamic Ads'] },
                ],
                requiredPlan: 'business',
                features: ['Promoted Ads', 'Tailored Audiences', 'Website Conversions'],
                setupFields: ['api_key', 'api_secret', 'access_token', 'pixel_id'],
            },
        ],
    },

    // ── 3. Google Services ────────────────────────────────────────
    {
        id: 'google',
        name: 'خدمات Google',
        nameEn: 'Google Services',
        icon: 'Chrome',
        color: 'from-green-600 to-emerald-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        integrations: [
            {
                id: 'google-workspace',
                name: 'Google Workspace',
                logo: 'https://cdn.simpleicons.org/google/4285F4',
                description: 'مجموعة Google الكاملة للأعمال. Gmail, Drive, Calendar, Meet, Chat للمؤسسات.',
                website: 'https://workspace.google.com',
                category: 'google',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 29, currency: 'AED', limit: 'مزامنة أساسية', features: ['Gmail Integration', 'Google Calendar', 'Google Drive'] },
                    { id: 'standard', name: 'معياري', price: 69, currency: 'AED', limit: 'مزامنة كاملة', features: ['كل الأساسي', 'Google Meet', 'Admin Console'] },
                    { id: 'premium', name: 'متميز', price: 149, currency: 'AED', limit: 'كاملة', features: ['Vault & DLP', 'Advanced Security', 'AppSheet'] },
                ],
                requiredPlan: 'starter',
                features: ['Gmail Integration', 'Google Calendar', 'Google Drive'],
                setupFields: ['service_account_key', 'domain'],
            },
            {
                id: 'google-analytics',
                name: 'Google Analytics',
                logo: 'https://cdn.simpleicons.org/googleanalytics/E37400',
                description: 'تحليلات الويب المتقدمة GA4. تتبع المستخدمين والتحويلات وسلوك الاستخدام بالذكاء الاصطناعي.',
                website: 'https://analytics.google.com',
                category: 'google',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 0, currency: 'AED', limit: 'مجاني', features: ['GA4 Tracking', 'Basic Reports', 'Real-Time Data'] },
                    { id: 'standard', name: 'معياري', price: 99, currency: 'AED', limit: 'تحليلات متقدمة', features: ['Enhanced Ecommerce', 'Custom Reports', 'Audience Segments'] },
                    { id: 'premium', name: 'متميز', price: 249, currency: 'AED', limit: 'كاملة', features: ['BigQuery Export', 'Data-Driven Attribution', 'Predictive Audiences'] },
                ],
                requiredPlan: 'starter',
                features: ['GA4 Tracking', 'Basic Reports', 'Real-Time Data'],
                setupFields: ['measurement_id', 'api_secret'],
            },
            {
                id: 'google-maps',
                name: 'Google Maps',
                logo: 'https://cdn.simpleicons.org/googlemaps/4285F4',
                description: 'خرائط Google للأعمال. تتبع المواقع, Geocoding, حساب المسافات والتوجيه.',
                website: 'https://cloud.google.com/maps-platform',
                category: 'google',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 49, currency: 'AED', limit: 'خرائط أساسية', features: ['Maps JavaScript API', 'Geocoding', 'Places'] },
                    { id: 'standard', name: 'معياري', price: 129, currency: 'AED', limit: 'خرائط + توجيه', features: ['كل الأساسي', 'Directions API', 'Distance Matrix'] },
                    { id: 'premium', name: 'متميز', price: 249, currency: 'AED', limit: 'كاملة', features: ['Routes API', 'Fleet Tracking', 'Geofencing'] },
                ],
                requiredPlan: 'starter',
                features: ['Maps JavaScript API', 'Geocoding', 'Places'],
                setupFields: ['api_key'],
            },
            {
                id: 'google-cloud-ai',
                name: 'Google Cloud AI',
                logo: 'https://cdn.simpleicons.org/googlecloud/4285F4',
                description: 'خدمات الذكاء الاصطناعي السحابية من Google. Vertex AI, Vision, NLP, Translation, Speech.',
                website: 'https://cloud.google.com/ai-platform',
                category: 'google',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 99, currency: 'AED', limit: 'AI أساسي', features: ['Vision API', 'Translation', 'Speech-to-Text'] },
                    { id: 'standard', name: 'معياري', price: 249, currency: 'AED', limit: 'AI متقدم', features: ['كل الأساسي', 'NLP', 'Document AI', 'AutoML'] },
                    { id: 'premium', name: 'متميز', price: 499, currency: 'AED', limit: 'كاملة', features: ['Vertex AI', 'Gemini API', 'Custom Models'] },
                ],
                requiredPlan: 'business',
                features: ['Vision API', 'Translation', 'Speech-to-Text'],
                setupFields: ['project_id', 'service_account_key'],
            },
        ],
    },

    // ── 4. Communication Services ─────────────────────────────────
    {
        id: 'communication',
        name: 'خدمات الاتصال',
        nameEn: 'Communication Services',
        icon: 'MessageSquare',
        color: 'from-emerald-600 to-teal-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        integrations: [
            {
                id: 'whatsapp-business',
                name: 'WhatsApp Business',
                logo: 'https://cdn.simpleicons.org/whatsapp/25D366',
                description: 'واجهة WhatsApp Business API الرسمية. رسائل الأعمال، الإشعارات، القوالب، الروبوتات.',
                website: 'https://business.whatsapp.com',
                category: 'communication',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 49, currency: 'AED', limit: '1000 رسالة/شهر', features: ['رسائل نصية', 'إشعارات', 'قوالب'] },
                    { id: 'standard', name: 'معياري', price: 149, currency: 'AED', limit: '10,000 رسالة/شهر', features: ['كل الأساسي', 'Chatbot', 'Media Messages'] },
                    { id: 'premium', name: 'متميز', price: 349, currency: 'AED', limit: 'غير محدود', features: ['API كامل', 'Bulk Messages', 'Interactive Buttons'] },
                ],
                requiredPlan: 'starter',
                features: ['رسائل نصية', 'إشعارات', 'قوالب'],
                setupFields: ['phone_number_id', 'access_token', 'business_id'],
            },
            {
                id: 'vonage',
                name: 'Vonage',
                logo: 'https://cdn.simpleicons.org/vonage/FFFFFF',
                description: 'منصة اتصالات متعددة القنوات. SMS, Voice, Video, المصادقة الثنائية.',
                website: 'https://vonage.com',
                category: 'communication',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 59, currency: 'AED', limit: '500 SMS/شهر', features: ['SMS API', 'Verify API', 'Number Insight'] },
                    { id: 'standard', name: 'معياري', price: 149, currency: 'AED', limit: '5,000 SMS/شهر', features: ['كل الأساسي', 'Voice API', 'Video API'] },
                    { id: 'premium', name: 'متميز', price: 299, currency: 'AED', limit: 'غير محدود', features: ['Contact Center', 'AI Studio', 'Proactive Connect'] },
                ],
                requiredPlan: 'starter',
                features: ['SMS API', 'Verify API', 'Number Insight'],
                setupFields: ['api_key', 'api_secret', 'application_id'],
            },
            {
                id: 'twilio',
                name: 'Twilio',
                logo: 'https://cdn.simpleicons.org/twilio/F22F46',
                description: 'بنية تحتية اتصالات سحابية. SMS, Voice, Video, Email عبر SendGrid. Flex Contact Center.',
                website: 'https://twilio.com',
                category: 'communication',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 69, currency: 'AED', limit: '1,000 رسالة/شهر', features: ['SMS API', 'Voice Calls', 'Verify 2FA'] },
                    { id: 'standard', name: 'معياري', price: 169, currency: 'AED', limit: '10,000 رسالة/شهر', features: ['كل الأساسي', 'Video API', 'Conversations'] },
                    { id: 'premium', name: 'متميز', price: 349, currency: 'AED', limit: 'غير محدود', features: ['Flex Contact Center', 'Segment CDP', 'AI Assistants'] },
                ],
                requiredPlan: 'starter',
                features: ['SMS API', 'Voice Calls', 'Verify 2FA'],
                setupFields: ['account_sid', 'auth_token'],
            },
        ],
    },

    // ── 5. Accounting & HR ────────────────────────────────────────
    {
        id: 'accounting_hr',
        name: 'المحاسبة والموارد البشرية',
        nameEn: 'Accounting & HR',
        icon: 'Calculator',
        color: 'from-orange-600 to-amber-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        integrations: [
            {
                id: 'quickbooks',
                name: 'QuickBooks',
                logo: 'https://cdn.simpleicons.org/quickbooks/2CA01C',
                description: 'نظام المحاسبة الأكثر شيوعاً للشركات الصغيرة والمتوسطة. فواتير، مصروفات، رواتب، ضرائب.',
                website: 'https://quickbooks.intuit.com',
                category: 'accounting_hr',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 99, currency: 'AED', limit: 'مزامنة يدوية', features: ['مزامنة الفواتير', 'المصروفات'] },
                    { id: 'standard', name: 'معياري', price: 249, currency: 'AED', limit: 'مزامنة تلقائية', features: ['كل الأساسي', 'Payroll', 'Tax Reports'] },
                    { id: 'premium', name: 'متميز', price: 499, currency: 'AED', limit: 'كاملة', features: ['API كامل', 'Custom Reports', 'Multi-company'] },
                ],
                requiredPlan: 'business',
                features: ['محاسبة كاملة', 'إدارة الرواتب', 'تقارير ضريبية', 'مزامنة مصرفية'],
                setupFields: ['client_id', 'client_secret', 'realm_id'],
            },
            {
                id: 'xero',
                name: 'Xero',
                logo: 'https://cdn.simpleicons.org/xero/13B5EA',
                description: 'نظام محاسبة سحابي بديهي للشركات الصغيرة. فواتير، مطابقة بنكية، كشف رواتب.',
                website: 'https://xero.com',
                category: 'accounting_hr',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 79, currency: 'AED', limit: 'مزامنة محدودة', features: ['فواتير', 'مطابقة بنكية'] },
                    { id: 'standard', name: 'معياري', price: 199, currency: 'AED', limit: 'مزامنة كاملة', features: ['Payroll', 'Inventory', 'Projects'] },
                    { id: 'premium', name: 'متميز', price: 399, currency: 'AED', limit: 'API كامل', features: ['Multi-currency', 'Advanced Analytics'] },
                ],
                requiredPlan: 'business',
                features: ['مطابقة بنكية تلقائية', 'فواتير ذكية', 'تقارير مالية', 'دعم 160+ عملة'],
                setupFields: ['client_id', 'client_secret'],
            },
            {
                id: 'zatca',
                name: 'ZATCA (هيئة الزكاة والضريبة)',
                logo: 'https://www.google.com/s2/favicons?domain=zatca.gov.sa&sz=128',
                description: 'التكامل المباشر مع هيئة الزكاة والضريبة والجمارك السعودية. إصدار فواتير إلكترونية متوافقة.',
                website: 'https://zatca.gov.sa',
                category: 'accounting_hr',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 149, currency: 'AED', limit: '500 فاتورة/شهر', features: ['فواتير B2B', 'QR Code', 'تقارير'] },
                    { id: 'standard', name: 'معياري', price: 349, currency: 'AED', limit: '5,000 فاتورة/شهر', features: ['كل الأساسي', 'B2B & B2C', 'الربط المباشر'] },
                    { id: 'premium', name: 'متميز', price: 699, currency: 'AED', limit: 'غير محدود', features: ['المرحلة 2 كاملة', 'Clearance Mode', 'Reporting Mode'] },
                ],
                requiredPlan: 'business',
                features: ['فواتير ZATCA Phase 2', 'Clearance & Reporting', 'QR Code ZATCA', 'UBL XML', 'تقارير VAT'],
                setupFields: ['certificate', 'private_key', 'zatca_username', 'zatca_password'],
            },
            {
                id: 'bamboohr',
                name: 'BambooHR',
                logo: 'https://cdn.simpleicons.org/bamboo/73D216',
                description: 'نظام الموارد البشرية الشامل. بيانات الموظفين، الأداء، التوظيف، الإجازات، كشوف الرواتب.',
                website: 'https://bamboohr.com',
                category: 'accounting_hr',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 89, currency: 'AED', limit: '50 موظف', features: ['ملفات الموظفين', 'الإجازات', 'التقارير'] },
                    { id: 'standard', name: 'معياري', price: 229, currency: 'AED', limit: '200 موظف', features: ['ATS', 'الأداء', 'Onboarding'] },
                    { id: 'premium', name: 'متميز', price: 449, currency: 'AED', limit: 'غير محدود', features: ['Payroll', 'Time Tracking', 'API كامل'] },
                ],
                requiredPlan: 'professional',
                features: ['إدارة ملفات الموظفين', 'نظام التوظيف ATS', 'تقييم الأداء', 'Onboarding ذكي'],
                setupFields: ['api_key', 'subdomain'],
            },
        ],
    },

    // ── 6. Sales & Marketing ──────────────────────────────────────
    {
        id: 'sales_marketing',
        name: 'المبيعات والتسويق',
        nameEn: 'Sales & Marketing',
        icon: 'TrendingUp',
        color: 'from-pink-600 to-rose-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        integrations: [
            {
                id: 'hubspot',
                name: 'HubSpot CRM',
                logo: 'https://cdn.simpleicons.org/hubspot/FF7A59',
                description: 'منصة CRM والتسويق الأشمل. إدارة العملاء، خطوط المبيعات، التسويق الآلي، خدمة العملاء.',
                website: 'https://hubspot.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 99, currency: 'AED', limit: '1,000 جهة اتصال', features: ['CRM', 'Deals', 'Forms'] },
                    { id: 'standard', name: 'معياري', price: 279, currency: 'AED', limit: '10,000 جهة اتصال', features: ['Marketing Hub', 'Sequences', 'Workflows'] },
                    { id: 'premium', name: 'متميز', price: 549, currency: 'AED', limit: 'غير محدود', features: ['Enterprise', 'Custom Reports', 'AI Insights'] },
                ],
                requiredPlan: 'business',
                features: ['CRM شامل', 'Sales Pipeline', 'Marketing Automation', 'Email Sequences', 'Analytics'],
                setupFields: ['api_key', 'portal_id'],
            },
            {
                id: 'mailchimp',
                name: 'Mailchimp',
                logo: 'https://cdn.simpleicons.org/mailchimp/FFE01B',
                description: 'منصة التسويق بالبريد الإلكتروني الأشهر. حملات، أتمتة، صفحات هبوط، تحليلات.',
                website: 'https://mailchimp.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 49, currency: 'AED', limit: '10,000 بريد/شهر', features: ['حملات', 'قوالب', 'تقارير أساسية'] },
                    { id: 'standard', name: 'معياري', price: 129, currency: 'AED', limit: '100,000 بريد/شهر', features: ['Automation', 'A/B Testing', 'Retargeting'] },
                    { id: 'premium', name: 'متميز', price: 299, currency: 'AED', limit: 'غير محدود', features: ['Multivariate Testing', 'Advanced Segmentation', 'API'] },
                ],
                requiredPlan: 'starter',
                features: ['حملات بريد إلكتروني', 'أتمتة تسويقية', 'A/B Testing', 'Landing Pages', 'SMS Marketing'],
                setupFields: ['api_key', 'server_prefix'],
            },
            {
                id: 'klaviyo',
                name: 'Klaviyo',
                logo: 'https://cdn.simpleicons.org/klaviyo/000000',
                description: 'منصة التسويق الآلي الأكثر تطوراً للتجارة الإلكترونية. Email + SMS + Push بالذكاء الاصطناعي.',
                website: 'https://klaviyo.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 69, currency: 'AED', limit: '10,000 بريد/شهر', features: ['Email Flows', 'Segmentation', 'تقارير'] },
                    { id: 'standard', name: 'معياري', price: 179, currency: 'AED', limit: '50,000 بريد/شهر', features: ['SMS Marketing', 'Predictive Analytics', 'A/B Testing'] },
                    { id: 'premium', name: 'متميز', price: 399, currency: 'AED', limit: 'غير محدود', features: ['AI Personalization', 'Mobile Push', 'Reviews', 'CDP'] },
                ],
                requiredPlan: 'business',
                features: ['Email Automation Flows', 'SMS Marketing', 'Push Notifications', 'Predictive Analytics'],
                setupFields: ['api_key', 'public_api_key'],
            },
            {
                id: 'sendgrid',
                name: 'SendGrid',
                logo: 'https://cdn.simpleicons.org/sendgrid/51A9E3',
                description: 'بنية تحتية لإرسال البريد الإلكتروني. Transactional + Marketing Email. موثوقية 99.99%.',
                website: 'https://sendgrid.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 39, currency: 'AED', limit: '40,000 بريد/شهر', features: ['Transactional Email', 'قوالب', 'Webhooks'] },
                    { id: 'standard', name: 'معياري', price: 99, currency: 'AED', limit: '400,000 بريد/شهر', features: ['Marketing Campaigns', 'Automation', 'Segmentation'] },
                    { id: 'premium', name: 'متميز', price: 229, currency: 'AED', limit: 'غير محدود', features: ['IP Warmup', 'Subuser Management', 'Advanced Analytics'] },
                ],
                requiredPlan: 'starter',
                features: ['Transactional Email API', 'Marketing Campaigns', 'Email Templates', 'Delivery Optimization'],
                setupFields: ['api_key'],
            },
            {
                id: 'semrush',
                name: 'SEMrush',
                logo: 'https://cdn.simpleicons.org/semrush/FF642D',
                description: 'أداة SEO والتسويق الرقمي الأكثر احترافية. تحليل الكلمات المفتاحية، المنافسين، الروابط.',
                website: 'https://semrush.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 129, currency: 'AED', limit: 'تحليل أساسي', features: ['Keyword Research', 'Site Audit', 'Rank Tracking'] },
                    { id: 'standard', name: 'معياري', price: 299, currency: 'AED', limit: 'تحليل شامل', features: ['Competitor Analysis', 'Backlink Audit', 'Content Marketing'] },
                    { id: 'premium', name: 'متميز', price: 599, currency: 'AED', limit: 'API كامل', features: ['API Access', 'Custom Reports', 'Agency Features'] },
                ],
                requiredPlan: 'business',
                features: ['Keyword Research', 'Competitor Analysis', 'Site Audit', 'Backlink Analysis', 'Rank Tracking'],
                setupFields: ['api_key'],
            },
            {
                id: 'hotjar',
                name: 'Hotjar',
                logo: 'https://cdn.simpleicons.org/hotjar/FF3C00',
                description: 'تحليل سلوك المستخدم. خرائط الحرارة، تسجيل الجلسات، استطلاعات الرأي لتحسين التحويل.',
                website: 'https://hotjar.com',
                category: 'sales_marketing',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 59, currency: 'AED', limit: '35 جلسة/يوم', features: ['Heatmaps', 'Session Recordings', 'Basic Surveys'] },
                    { id: 'standard', name: 'معياري', price: 149, currency: 'AED', limit: '500 جلسة/يوم', features: ['Unlimited Recordings', 'Funnels', 'Form Analytics'] },
                    { id: 'premium', name: 'متميز', price: 329, currency: 'AED', limit: 'غير محدود', features: ['Trends', 'Advanced Filtering', 'API', 'Slack Integration'] },
                ],
                requiredPlan: 'starter',
                features: ['Heatmaps', 'Session Recordings', 'Conversion Funnels', 'Form Analytics', 'User Surveys'],
                setupFields: ['site_id', 'api_key'],
            },
        ],
    },

    // ── 7. Business Management ────────────────────────────────────
    {
        id: 'management',
        name: 'إدارة الأعمال',
        nameEn: 'Business Management',
        icon: 'Layers',
        color: 'from-indigo-600 to-violet-600',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        integrations: [
            {
                id: 'microsoft365',
                name: 'Microsoft 365',
                logo: 'https://cdn.simpleicons.org/microsoft/5E5E5E',
                description: 'مجموعة أدوات Microsoft الكاملة. Teams، Outlook، SharePoint، OneDrive، Power BI، Azure AD.',
                website: 'https://microsoft.com/microsoft-365',
                category: 'management',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 89, currency: 'AED', limit: '10 مستخدم', features: ['Teams', 'Outlook', 'OneDrive 1TB'] },
                    { id: 'standard', name: 'معياري', price: 229, currency: 'AED', limit: '50 مستخدم', features: ['SharePoint', 'Power BI', 'Azure AD'] },
                    { id: 'premium', name: 'متميز', price: 499, currency: 'AED', limit: 'غير محدود', features: ['Copilot AI', 'Defender', 'Advanced Compliance'] },
                ],
                requiredPlan: 'business',
                features: ['Microsoft Teams', 'Outlook Integration', 'SharePoint', 'OneDrive', 'Power BI'],
                setupFields: ['tenant_id', 'client_id', 'client_secret'],
            },
            {
                id: 'slack',
                name: 'Slack',
                logo: 'https://cdn.simpleicons.org/slack/4A154B',
                description: 'منصة التواصل الفوري للفرق. قنوات، رسائل مباشرة، تكاملات، تطبيقات، ملفات.',
                website: 'https://slack.com',
                category: 'management',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 49, currency: 'AED', limit: 'الرسائل الأساسية', features: ['القنوات', 'DMs', 'الملفات'] },
                    { id: 'standard', name: 'معياري', price: 129, currency: 'AED', limit: 'تاريخ كامل', features: ['Workflow Builder', 'Apps', 'Video Clips'] },
                    { id: 'premium', name: 'متميز', price: 279, currency: 'AED', limit: 'API كامل', features: ['Slack AI', 'Compliance', 'Advanced Security'] },
                ],
                requiredPlan: 'starter',
                features: ['القنوات التنظيمية', 'Slack AI', 'Workflow Builder', '2200+ App Integrations'],
                setupFields: ['bot_token', 'signing_secret', 'app_token'],
            },
            {
                id: 'jira',
                name: 'Jira & Confluence',
                logo: 'https://cdn.simpleicons.org/jira/0052CC',
                description: 'إدارة المشاريع والتوثيق من Atlassian. Scrum، Kanban، Roadmaps، قاعدة المعرفة.',
                website: 'https://atlassian.com/software/jira',
                category: 'management',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 69, currency: 'AED', limit: '10 مستخدم', features: ['Scrum & Kanban', 'Backlog', 'Reports'] },
                    { id: 'standard', name: 'معياري', price: 179, currency: 'AED', limit: '50 مستخدم', features: ['Roadmaps', 'Confluence', 'Automation'] },
                    { id: 'premium', name: 'متميز', price: 379, currency: 'AED', limit: 'غير محدود', features: ['Advanced Roadmaps', 'AI', 'Insights'] },
                ],
                requiredPlan: 'business',
                features: ['Agile Project Management', 'Scrum/Kanban Boards', 'Advanced Roadmaps', 'Confluence Wiki'],
                setupFields: ['domain', 'email', 'api_token'],
            },
            {
                id: 'docusign',
                name: 'DocuSign',
                logo: 'https://cdn.simpleicons.org/docusign/FFCE00',
                description: 'التوقيع الإلكتروني الأكثر موثوقية عالمياً. توقيع العقود والوثائق القانونية بأمان تام.',
                website: 'https://docusign.com',
                category: 'management',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 79, currency: 'AED', limit: '100 مظروف/شهر', features: ['توقيع إلكتروني', 'QR Verification'] },
                    { id: 'standard', name: 'معياري', price: 199, currency: 'AED', limit: '1,000 مظروف/شهر', features: ['Templates', 'Bulk Send', 'API'] },
                    { id: 'premium', name: 'متميز', price: 449, currency: 'AED', limit: 'غير محدود', features: ['Notary', 'ID Verification', 'Analytics'] },
                ],
                requiredPlan: 'business',
                features: ['توقيع إلكتروني معتمد', 'قوالب عقود', 'Bulk Sending', 'ID Verification', 'Audit Trail'],
                setupFields: ['integration_key', 'secret_key', 'account_id'],
            },
            {
                id: 'zapier',
                name: 'Zapier Automation',
                logo: 'https://cdn.simpleicons.org/zapier/FF4A00',
                description: 'أتمتة العمليات بين آلاف التطبيقات. إنشاء Workflows تلقائية بدون كود مع دعم AI.',
                website: 'https://zapier.com',
                category: 'management',
                plans: [
                    { id: 'basic', name: 'أساسي', price: 59, currency: 'AED', limit: '750 مهمة/شهر', features: ['Zaps أساسية', '2-step Zaps'] },
                    { id: 'standard', name: 'معياري', price: 149, currency: 'AED', limit: '5,000 مهمة/شهر', features: ['Multi-step Zaps', 'Filters', 'Schedules'] },
                    { id: 'premium', name: 'متميز', price: 349, currency: 'AED', limit: '50,000 مهمة/شهر', features: ['AI by Zapier', 'Paths', 'Custom Logic'] },
                ],
                requiredPlan: 'starter',
                features: ['5000+ تطبيق', 'Zaps متعددة الخطوات', 'AI by Zapier', 'Webhooks'],
                setupFields: ['api_key'],
            },
        ],
    },
];

// Flatten all integrations for search
export const ALL_INTEGRATIONS = INTEGRATION_GROUPS.flatMap(g =>
    g.integrations.map(i => ({ ...i, groupId: g.id, groupName: g.name, groupNameEn: g.nameEn }))
);

// Required plan labels
export const PLAN_LABELS: Record<string, { en: string; ar: string; color: string }> = {
    starter: { en: 'REQUIRES STARTER+', ar: 'يتطلب ستارتر+', color: 'bg-blue-100 text-blue-700' },
    business: { en: 'REQUIRES BUSINESS+', ar: 'يتطلب بزنس+', color: 'bg-purple-100 text-purple-700' },
    professional: { en: 'REQUIRES PROFESSIONAL+', ar: 'يتطلب بروفشنال+', color: 'bg-amber-100 text-amber-700' },
    enterprise: { en: 'REQUIRES ENTERPRISE', ar: 'يتطلب إنتربرايز', color: 'bg-red-100 text-red-700' },
};
