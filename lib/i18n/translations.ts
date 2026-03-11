import { APP_NAME } from "@/constants/values";

export const translations = {
  sw: {
    languageLabel: "Swahili",
      nav: {
      brand: `${APP_NAME}`,
      tagline: `${APP_NAME} · Invoicing Sahihi, Rahisi`,
      howItWorks: "Inavyofanya Kazi",
      features: "Vipengele",
      pricing: "Bei",
      faq: "Maswali",
      login: "Ingia",
      signup: "Jisajili",
      dashboard: "Dashibodi",
      logout: "Toka",
    },
    dashboard: {
      home: {
        greetingSubtitle: "Tayari kutungia ankara na kupokea malipo.",
        completeProfileTitle: "Kamilisha wasifu wako",
        completeProfileDescription:
          "Ongeza aina ya akaunti, jina na maelezo ili kuanza kutumia ankara na kudhibiti biashara yako.",
        completeProfileCta: "Kamilisha wasifu",
      },
    },
    footer: {
      tagline: `${APP_NAME} · Invoicing Sahihi, Rahisi`,
      description:
        "Jukwaa la invoicing kwa wafanyabiashara na biashara — tengeneza ankara, tuma kwa kiungo, pokee malipo kwa pesa za simu.",
      company: "Kampuni",
      aboutUs: "Kuhusu Sisi",
      resources: "Rasilimali",
      helpCenter: "Kituo cha Msaada",
      termsOfService: "Vigezo vya Huduma",
      privacyPolicy: "Sera ya Faragha",
      connect: "Unganisha",
      copyright: `© 2025 ${APP_NAME}. Haki zote zimehifadhiwa.`,
      privacy: "Faragha",
      terms: "Vigezo",
      support: "Msaada",
    },
    landing: {
      tagline: `Fanya Biashara Yako Iwe ${APP_NAME}`,
      headline: `${APP_NAME} – Invoicing Sahihi, Rahisi`,
      subheadline:
        "Tengeneza ankara za kibiashara, tuma kwa kiungo, fuatia maoni, na upoke malipo kwa pesa za simu. Imejengwa kwa Afrika.",
      supportingText:
        `${APP_NAME} ni jukwaa la invoicing linalokuruhusu kuunda, kutuma na kufuatilia ankara kwa urahisi.`,
      cta: "Anza Bure",
      heroLabel: "Invoicing ya Kibiashara kwa Afrika",
      noCreditCard: "Hakuna kadi ya kredi inayohitajika",
      socialProof: "Imepimwa 5.0 na wafanyabiashara",
      trustedBy: "Inaaminika na wafanyabiashara na biashara",
      testimonials: {
        one: {
          quoteStart: "Hii ni ",
          quoteHighlight: "bora",
          quoteEnd: " kwa kutuma ankara na kupokea malipo kwa haraka.",
          name: "Sarah N.",
          affiliation: "Mfanyabiashara",
        },
        two: {
          quoteStart: "Kiungo cha malipo na ufuatiliaji ",
          quoteHighlight: "zinasaidia sana",
          quoteEnd: "...",
          name: "Jonathan S.",
          affiliation: "Mwanzilishi wa startup",
        },
        three: {
          quoteStart: "...jukwaa hili ",
          quoteHighlight: "haifai kuwa bure",
          quoteEnd: "",
          name: "Tiffany W.",
          affiliation: "Mwanafunzi @ chuo",
        },
      },
      secondaryCta: "Jifunze Zaidi",
      simpleSection: {
        title: "Rahisi, lakini lenye nguvu",
        createInvoices: "Tengeneza ankara za kibiashara na muundo mzuri",
        sendAndTrack: "Tuma ankara kwa kiungo na ufuatilie waliotazama",
        acceptPayments: "Pokee malipo kwa pesa za simu (mobile money)",
        monitorStatus: "Fuata hali ya ankara – imelipwa, iliyochelewa, n.k.",
      },
      features: {
        title: "Suluhisho Rahisi kwa Biashara Yako",
        subtitle: `${APP_NAME} inakufanya uweze kurekodi na kusimamia rekodi za biashara yako kwa urahisi na uwazi.`,
        recordSales: {
          title: "Rekodi Mauzo",
          description:
            "Rekodi mauzo yako haraka na urahisi. Huru na rahisi kutumia.",
        },
        trackExpenses: {
          title: "Sikiza Gharama",
          description:
            "Tunza gharama zako kwa kategoria na usimamie uwekezaji wako.",
        },
        monthlyReports: {
          title: "Ripoti za Kila Mwezi",
          description:
            "Zalisha ripoti za kila mwezi na ujipatie maoni ya haraka kuhusu utendaji wa biashara yako.",
        },
        traReady: {
          title: "Tayari kwa TRA",
          description:
            "Andaa rekodi zako kwa TRA kwa urahisi. Kukusaidia tu, siyo kufanya malipo.",
        },
      },
      howItWorks: {
        title: "Inafanya Kazi Vipi?",
        step1: {
          title: "Sajili biashara yako",
          description: "",
        },
        step2: {
          title: "Rekodi mauzo na matumizi",
          description: "",
        },
        step3: {
          title: "Pata muhtasari wa biashara",
          description: "",
        },
        step4: {
          title: "Jiandae kwa TRA",
          description: "",
        },
      },
      benefits: {
        title: `Kwa Nini Chagua ${APP_NAME}?`,
        subtitle:
          "Vifaa vyetu vinakusaidia kufanya kazi yako iwe rahisi na wazi.",
        fast: {
          title: "Haraka na Rahisi",
          description:
            "Rekodi mauzo yako chini ya sekunde 5. Fomu rahisi na za haraka.",
        },
        secure: {
          title: "Salama",
          description:
            "Data yako iko salama. Rekodi zako ni za wewe tu na zinatumia Row-Level Security.",
        },
        traReady: {
          title: "Tayari kwa TRA",
          description:
            "Andaa rekodi zako kwa TRA kwa urahisi. Sisi hatutoi malipo, lakini tunakusaidia kuandaa.",
        },
        transparent: {
          title: "Wazi na Wazi",
          description:
            "Angalia muhtasari wako wakati wowote. Kila kitu ni wazi na rahisi kuelewa.",
        },
      },
      problem: {
        title: "Biashara Nyingi Haziogopi TRA — Huogopa Kukosa Rekodi",
        intro: "Wafanyabiashara wengi hupata wasiwasi kwa sababu:",
        painPoints: {
          salesNotRecorded: "Mauzo hayajaandikwa vizuri",
          expensesUnknown: "Matumizi hayajulikani wazi",
          noSummary: "Hakuna muhtasari wa kila mwezi",
          incompleteRecords:
            "Taarifa zipo kwenye daftari au kumbukumbu zisizo kamili",
        },
        closing: "Hii husababisha hofu na mkanganyiko usio wa lazima.",
      },
      solution: {
        title: `${APP_NAME} Hukusaidia Kujiandaa Mapema`,
        intro: `Kwa kutumia ${APP_NAME} unapata:`,
        whatItDoes: {
          recordSales: "Rekodi sahihi za mauzo",
          trackExpenses: "Ufuatiliaji wa matumizi",
          viewTotals: "Muhtasari wa mapato na faida",
          generateReports: "Ripoti rahisi kushirikisha au kuchapisha",
        },
        closing: "Hakuna kubahatisha. Hakuna presha.",
      },
      confidence: {
        title: "Zungumza kwa Uhakika Unapoulizwa Maswali ya Biashara",
        intro: "Unapokuwa na takwimu zako kwa mpangilio:",
        benefits: {
          knowYourBusiness: "Unajua biashara yako inasimama wapi",
          traNotThreatening: "Maswali ya TRA hayakutishi",
          alwaysReady: "Unakuwa tayari wakati wowote taarifa zinapohitajika",
        },
        closing: "Uwazi hukupa nguvu.",
      },
      whoIsFor: {
        title: `${APP_NAME} Imeundwa Kwa Ajili Ya:`,
        items: {
          smes: "Wafanyabiashara wadogo na wa kati",
          shopOwners: "Wamiliki wa maduka, migahawa, salons",
          services: "Watoa huduma",
          informal: "Biashara zisizo na mfumo rasmi wa accounting",
        },
      },
      whatIsNot: {
        title: `${APP_NAME} HAIFANYI Nini`,
        items: {
          noSubmit: "Haitoi malipo kwa TRA",
          noReplaceAccountant: "Haiwakilishi karani wako",
          noBankAccess: "Haipati kufikia akaunti za benki au pesa za simu",
          noMoneyHandling: "Haihamishi, haikusanyi, au haihifadhi pesa",
        },
        closing: `${APP_NAME} inakusaidia kuweka mipango na kuandaa — hakuna zaidi, hakuna kilichofichwa.`,
      },
      pricing: {
        title: "Bei Rahisi",
        noHiddenFees: "Hakuna ada zisizojulikana.",
        poweredBy: "Inaendeshwa na kuhifadhiwa na",
        mostPopular: "Inayopendwa zaidi",
        contactUs: "Wasiliana nasi",
        free: {
          name: "Bure",
          description: "Anza kutuma ankara. Vipengele vya msingi kwa wafanyabiashara.",
          price: "TZS 0",
          period: "/mwezi",
          cta: "Chagua mpango huu",
          features: ["Ankara 5 kwa mwezi", "Kiungo cha malipo", "Ufuatiliaji wa maoni", "Malipo ya pesa za simu"],
        },
        pro: {
          name: "Pro",
          description: "Kwa biashara zinazokua. Ankara nyingi na vipengele zaidi.",
          price: "9,000",
          period: "/mwezi",
          cta: "Chagua mpango huu",
          features: ["Ankara 50 kwa mwezi", "Vitengo vya biashara", "Ripoti na tafiti", "Msaada wa kipaumbele"],
        },
        business: {
          name: "Biashara",
          description: "Kwa timu na mahitaji maalum. Ankara zisizo na kikomo na usaidizi.",
          price: "",
          period: "",
          cta: "Wasiliana nasi",
          features: ["Ankara zisizo na kikomo", "Vitengo vingi", "API na uunganishaji", "Meneja akaunti"],
        },
      },
      trustCompliance: {
        title: `${APP_NAME} Inafuata Sheria`,
        statements: {
          noTaxEvasion: `${APP_NAME} haisaidii kukwepa kodi.`,
          noBankConnection: "Hatuunganishi akaunti za benki au MNO.",
          helpsRecords: "Tunasaidia biashara kuwa na rekodi sahihi na wazi.",
        },
      },
      subscribeTitle: "Jiunge na Orodha Yetu",
      subscribeDescription: `Pata habari za siku za mbele kuhusu ${APP_NAME}.`,
      subscribeButton: "Jiandikishe",
      emailPlaceholder: "Ingiza barua pepe yako",
      faq: {
        title: "Maswali Yanayoulizwa Mara kwa Mara",
        subtitle: `Tafuta majibu kwa maswali yako kuhusu ${APP_NAME}.`,
        comingSoon: "Sehemu hii itajengwa hivi karibuni.",
      },
      finalCta: {
        title: `Anza Kupata Malipo Kwa Haraka`,
        subtitle: "Unda akaunti ya bure na anza kutuma ankara leo.",
        cta: "Anza Bure Leo",
      },
    },
    auth: {
      onboarding: {
        title: "Karibu! Ongeza Maelezo Yako",
        subtitle: "Jaza maelezo yako na uanze kutumia ankara",
        businessName: "Jina la Biashara",
        businessNamePlaceholder: "Jina la biashara yako",
        yourName: "Jina lako",
        yourNamePlaceholder: "Jina lako kamili",
        location: "Mahali / Anwani",
        locationPlaceholder: "Mji, mtaa au anwani kamili",
        capacity: "Uwezo (hiari)",
        capacityPlaceholder: "mf. idadi ya wafanyakazi, kiwango",
        currency: "Sarafu",
        next: "Endelea",
        finish: "Kamilisha",
        creating: "Inatengeneza...",
        phoneOptional: "Nambari ya simu (hiari)",
        phonePlaceholder: "0767 XXX XXX",
      },
      login: {
        welcome: "Karibu tena",
        subtitle: "Ingia kwenye akaunti yako",
        googleSignIn: "Ingia na Google",
        orContinueWith: "Au endelea na",
        email: "Barua pepe",
        phone: "Simu",
        password: "Nenosiri",
        forgotPassword: "Umesahau nenosiri?",
        passwordPlaceholder: "Ingiza nenosiri lako",
        signingIn: "Inaingia...",
        signIn: "Ingia",
        noAccount: "Huna akaunti?",
        signUp: "Jisajili",
        terms:
          `Kwa kuendelea, unakubali Vigezo vya Huduma na Sera ya Faragha ya ${APP_NAME}.`,
        error: "Barua pepe/simu au nenosiri si sahihi",
      },
      signup: {
        title: `Unda akaunti yako ya ${APP_NAME}`,
        subtitle: "Jisajili ili uanze",
        googleSignUp: "Jisajili na Google",
        orContinueWith: "Au endelea na",
        fullName: "Jina kamili",
        namePlaceholder: "Jina lako",
        email: "Barua pepe",
        phone: "Simu",
        password: "Nenosiri",
        passwordPlaceholder: "Ingiza nenosiri lenye nguvu",
        signingUp: "Inasajili...",
        signUp: "Jisajili",
        haveAccount: "Tayari una akaunti?",
        signIn: "Ingia",
        terms:
          `Kwa kuendelea, unakubali Vigezo vya Huduma na Sera ya Faragha ya ${APP_NAME}.`,
        error: "Haikuweza kusajili. Tafadhali jaribu tena.",
        fillAllFields: "Tafadhali jaza sehemu zote",
        emailRequired: "Barua pepe inahitajika",
        phoneRequired: "Nambari ya simu inahitajika",
      },
      verifyOtp: {
        title: "Thibitisha nambari yako ya simu",
        subtitle: "Tumetuma msimbo wa uthibitishaji kwa",
        phone: "Nambari ya simu",
        code: "Msimbo wa uthibitishaji",
        codePlaceholder: "Ingiza msimbo wa tarakimu 6",
        codeHint: "Ingiza msimbo wa tarakimu 6 uliotumwa kwenye simu yako",
        verifying: "Inathibitisha...",
        verify: "Thibitisha",
        noCode: "Hukupokea msimbo?",
        resend: "Tuma tena",
        resendIn: "Tuma tena baada ya sekunde {seconds}",
        sending: "Inatuma...",
        error: "Msimbo si sahihi. Tafadhali jaribu tena.",
        fillAllFields: "Tafadhali ingiza nambari ya simu na msimbo",
        phoneRequired: "Nambari ya simu inahitajika",
      },
    },
  },
  en: {
    languageLabel: "English",
    nav: {
      brand: `${APP_NAME}`,
      tagline: "Professional Invoicing, Made Simple",
      howItWorks: "How It Works",
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      login: "Login",
      signup: "Sign Up",
      dashboard: "Dashboard",
      logout: "Logout",
    },
    dashboard: {
      home: {
        greetingSubtitle: "Ready to create invoices and get paid.",
        completeProfileTitle: "Complete your profile",
        completeProfileDescription:
          "Add your account type, name and details to start using invoices and manage your business.",
        completeProfileCta: "Complete profile",
      },
    },
    footer: {
      tagline: `${APP_NAME} · Professional Invoicing, Made Simple`,
      description:
        "Invoicing for freelancers and businesses — create invoices, send via link, get paid with mobile money.",
      company: "Company",
      aboutUs: "About Us",
      resources: "Resources",
      helpCenter: "Help Center",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      connect: "Connect",
      copyright: `© 2025 ${APP_NAME}. All rights reserved.`,
      privacy: "Privacy",
      terms: "Terms",
      support: "Support",
    },
    landing: {
      tagline: `${APP_NAME} · Professional Invoicing, Made Simple`,
      headline: "Professional invoicing, made simple",
      subheadline:
        "Create professional invoices, send via link, track views, and get paid with mobile money. Built for Africa.",
      supportingText: `${APP_NAME} helps freelancers and businesses create, send, and track invoices with payment links.`,
      cta: `Try ${APP_NAME} free`,
      heroLabel: "Professional invoicing for Africa",
      noCreditCard: "No credit card required",
      socialProof: "Rated 5.0 by freelancers & businesses",
      trustedBy: "Trusted by freelancers & SMEs",
      testimonials: {
        one: {
          quoteStart: "This is hands down the ",
          quoteHighlight: "best",
          quoteEnd: " app for invoicing and getting paid fast.",
          name: "Sarah N.",
          affiliation: "Freelancer",
        },
        two: {
          quoteStart: "Payment links and tracking are ",
          quoteHighlight: "insanely useful",
          quoteEnd: "...",
          name: "Jonathan S.",
          affiliation: "Startup founder",
        },
        three: {
          quoteStart: "...this app should ",
          quoteHighlight: "not be free",
          quoteEnd: "",
          name: "Tiffany W.",
          affiliation: "Med school student @ NYU",
        },
      },
      secondaryCta: "Learn more",
      simpleSection: {
        title: "Simple, but powerful",
        createInvoices: "Create professional invoices with a clean layout",
        sendAndTrack: "Send invoices via link and track when they’re viewed",
        acceptPayments: "Accept payments through mobile money",
        monitorStatus: "Monitor invoice status — paid, overdue, and more",
      },
      features: {
        title: "Simple Solutions for Your Business",
        subtitle: `${APP_NAME} makes it easy to record and manage your business records with clarity and transparency.`,
        recordSales: {
          title: "Record Sales",
          description:
            "Record your sales quickly and easily. Free and simple to use.",
        },
        trackExpenses: {
          title: "Track Expenses",
          description:
            "Store your expenses by category and manage your spending.",
        },
        monthlyReports: {
          title: "Monthly Reports",
          description:
            "Generate monthly reports and get quick insights into your business performance.",
        },
        traReady: {
          title: "TRA Ready",
          description:
            "Prepare your records for TRA with ease. We help you prepare, not file.",
        },
      },
      howItWorks: {
        title: "How It Works",
        step1: {
          title: "Register your business",
          description: "",
        },
        step2: {
          title: "Record sales and expenses",
          description: "",
        },
        step3: {
          title: "Get business summary",
          description: "",
        },
        step4: {
          title: "Prepare for TRA",
          description: "",
        },
      },
      benefits: {
        title: `Why Choose ${APP_NAME}?`,
        subtitle: "Our tools help make your work easier and more transparent.",
        fast: {
          title: "Fast & Easy",
          description:
            "Record your sales in under 5 seconds. Simple and quick forms.",
        },
        secure: {
          title: "Secure",
          description:
            "Your data is secure. Your records are yours alone using Row-Level Security.",
        },
        traReady: {
          title: "TRA Ready",
          description:
            "Prepare your records for TRA with ease. We don't file, but we help you prepare.",
        },
        transparent: {
          title: "Clear & Transparent",
          description:
            "View your summary anytime. Everything is clear and easy to understand.",
        },
      },
      problem: {
        title: "Most Businesses Don't Fear TRA — They Fear Missing Records",
        intro: "Many business owners worry because:",
        painPoints: {
          salesNotRecorded: "Sales are not properly recorded",
          expensesUnknown: "Expenses are not clearly known",
          noSummary: "There is no monthly summary",
          incompleteRecords:
            "Information is in notebooks or incomplete records",
        },
        closing: "This causes unnecessary fear and confusion.",
      },
      solution: {
        title: `${APP_NAME} Helps You Prepare Early`,
        intro: `By using ${APP_NAME} you get:`,
        whatItDoes: {
          recordSales: "Accurate sales records",
          trackExpenses: "Expense tracking",
          viewTotals: "Summary of income and profit",
          generateReports: "Easy reports to share or print",
        },
        closing: "No guessing. No pressure.",
      },
      confidence: {
        title: "Speak with Confidence When Asked Business Questions",
        intro: "When you have your data in order:",
        benefits: {
          knowYourBusiness: "You know where your business stands",
          traNotThreatening: "TRA questions are not threatening",
          alwaysReady: "You are ready anytime reports are needed",
        },
        closing: "Transparency gives you power.",
      },
      whoIsFor: {
        title: `${APP_NAME} Is Built For:`,
        items: {
          smes: "Small and medium business owners",
          shopOwners: "Shop, restaurant, salon owners",
          services: "Service providers",
          informal: "Businesses without formal accounting systems",
        },
      },
      whatIsNot: {
        title: `What ${APP_NAME} Does NOT Do`,
        items: {
          noSubmit: "Does not submit returns to TRA",
          noReplaceAccountant: "Does not replace your accountant",
          noBankAccess: "Does not access bank or mobile money accounts",
          noMoneyHandling: "Does not move, collect, or hold money",
        },
        closing: `${APP_NAME} helps you stay organized and prepared — nothing more, nothing hidden.`,
      },
      pricing: {
        title: "Simple pricing",
        noHiddenFees: "No hidden fees.",
        poweredBy: "Powered and secured by",
        mostPopular: "Most popular",
        contactUs: "Contact us",
        free: {
          name: "Free",
          description: "Get started with invoicing. Essential features for freelancers.",
          price: "$0",
          period: "/month",
          cta: "Choose this plan",
          features: ["5 invoices per month", "Payment links", "View tracking", "Mobile money payments"],
        },
        pro: {
          name: "Pro",
          description: "For growing businesses. More invoices and advanced features.",
          price: "$9",
          period: "/month",
          cta: "Choose this plan",
          features: ["50 invoices per month", "Multiple businesses", "Reports & analytics", "Priority support"],
        },
        business: {
          name: "Business",
          description: "For teams and custom needs. Unlimited invoices and dedicated support.",
          price: "",
          period: "",
          cta: "Contact us",
          features: ["Unlimited invoices", "Multiple businesses", "API & integrations", "Account manager"],
        },
      },
      trustCompliance: {
        title: `${APP_NAME} Follows the Law`,
        statements: {
          noTaxEvasion: `${APP_NAME} does not help evade taxes.`,
          noBankConnection: "We do not connect bank or MNO accounts.",
          helpsRecords:
            "We help businesses have accurate and transparent records.",
        },
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: `Find answers to your questions about ${APP_NAME}.`,
        comingSoon: "This section will be built soon.",
      },
      subscribeTitle: "Join Our Mailing List",
      subscribeDescription: `Get updates about ${APP_NAME}.`,
      subscribeButton: "Subscribe",
      emailPlaceholder: "Enter your email",
      finalCta: {
        title: "Get paid faster",
        subtitle: "Create a free account and start sending invoices today.",
        cta: "Start free today",
      },
    },
    auth: {
      onboarding: {
        title: "Welcome! Set up your account",
        subtitle: "Add a few details to get started",
        businessName: "Business name",
        businessNamePlaceholder: "Your business or trading name",
        yourName: "Your name",
        yourNamePlaceholder: "Your full name",
        location: "Location / Address",
        locationPlaceholder: "City, area or full address",
        capacity: "Capacity (optional)",
        capacityPlaceholder: "e.g. team size, scale",
        currency: "Currency",
        next: "Continue",
        finish: "Finish",
        creating: "Setting up...",
        phoneOptional: "Phone number (optional)",
        phonePlaceholder: "0767 XXX XXX",
      },
      login: {
        welcome: "Welcome back",
        subtitle: "Sign in to your account",
        googleSignIn: "Sign in with Google",
        orContinueWith: "Or continue with",
        email: "Email",
        phone: "Phone",
        password: "Password",
        forgotPassword: "Forgot password?",
        passwordPlaceholder: "Enter your password",
        signingIn: "Signing in...",
        signIn: "Sign in",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        terms:
          `By continuing, you agree to ${APP_NAME}'s Terms of Service and Privacy Policy.`,
        error: "Incorrect email/phone or password",
      },
      signup: {
        title: `Create your ${APP_NAME} account`,
        subtitle: "Sign up to get started",
        googleSignUp: "Sign up with Google",
        orContinueWith: "Or continue with",
        fullName: "Full Name",
        namePlaceholder: "Your name",
        email: "Email",
        phone: "Phone",
        password: "Password",
        passwordPlaceholder: "Enter a strong password",
        signingUp: "Signing you up...",
        signUp: "Sign Up",
        haveAccount: "Already have an account?",
        signIn: "Sign in",
        terms:
          `By continuing, you agree to ${APP_NAME}'s Terms of Service and Privacy Policy.`,
        error: "Unable to register. Please try again.",
        fillAllFields: "Please complete all fields",
        emailRequired: "Email is required",
        phoneRequired: "Phone number is required",
      },
      verifyOtp: {
        title: "Verify your phone number",
        subtitle: "We've sent a verification code to",
        phone: "Phone Number",
        code: "Verification Code",
        codePlaceholder: "Enter 6-digit code",
        codeHint: "Enter the 6-digit code sent to your phone",
        verifying: "Verifying...",
        verify: "Verify Phone",
        noCode: "Didn't receive the code?",
        resend: "Resend code",
        resendIn: "Resend code in {seconds} seconds",
        sending: "Sending...",
        error: "Invalid OTP. Please try again.",
        fillAllFields: "Please enter your phone and OTP",
        phoneRequired: "Phone number is required",
      },
    },
  },
};

export const defaultLanguage = "sw";

// Helper function to replace variables in translation strings
const replaceVariables = (value: string, vars: Record<string, string> = {}) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)}/g, (_, name) => vars?.[name] ?? `{${name}}`);
};

// Helper function to resolve nested keys (e.g., "nav.findJobs")
const resolveKey = (
  lang: keyof typeof translations,
  key: string
): string | undefined => {
  if (!key) return undefined;
  const parts = key.split(".");
  let current: unknown = translations[lang];
  for (const part of parts) {
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, part)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
};

// Translation function
export const t = (
  lang: keyof typeof translations,
  key: string,
  vars: Record<string, string> = {}
): string => {
  const resolved = resolveKey(lang, key);
  const value = resolved !== undefined ? resolved : key;
  return replaceVariables(
    typeof value === "string" ? value : String(value),
    vars
  );
};
