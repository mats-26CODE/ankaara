import { APP_NAME } from "@/constants/values";
import {
  dashboardCommonExtra,
  dashboardFeatures,
  dashboardStatusExtra,
  dashboardToast,
} from "@/lib/i18n/dashboard-features";

export const translations = {
  sw: {
    languageLabel: "Swahili",
    nav: {
      brand: `${APP_NAME}`,
      tagline: `${APP_NAME} · POS, Mauzo na Invoisi kwa Urahisi`,
      howItWorks: "Inavyofanya Kazi",
      features: "Vipengele",
      pricing: "Bei",
      faq: "Maswali",
      login: "Ingia",
      signup: "Jisajili",
      dashboard: "Dashibodi",
      logout: "Toka",
      language: "Lugha",
      goToDashboard: "Nenda kwenye Dashibodi",
      accountRole: {
        owner: "Mmiliki",
        manager: "Meneja",
        accountant: "Mhasibu",
        salesperson: "Muuzaji",
      },
    },
    greeting: {
      morning: "Habari za asubuhi 🌅",
      afternoon: "Habari za mchana ☀️",
      evening: "Habari za jioni 🌆",
      night: "Usiku mwema 🌙",
    },
    dashboard: {
      nav: {
        title: "Dashibodi",
        groupMain: "Kuu",
        groupInvoices: "Invoisi",
        groupQuotations: "Quotation",
        groupAccount: "Akaunti",
        overview: "Muhtasari",
        sales: "Mauzo",
        profits: "Faida",
        reports: "Ripoti",
        inventory: "Stock",
        clients: "Wateja",
        loans: "Mikopo",
        expenses: "Matumizi",
        staff: "Wafanyakazi",
        invoices: "Invoisi",
        allInvoices: "Invoisi Zote",
        createInvoice: "Tengeneza Invoisi",
        quotations: "Quotation",
        allQuotations: "Quotation Zote",
        createQuotation: "Tengeneza Quotation",
        invoiceTemplates: "Template za Invoisi",
        profile: "Wasifu",
        businesses: "Biashara",
      },
      common: {
        save: "Hifadhi",
        cancel: "Ghairi",
        delete: "Futa",
        edit: "Hariri",
        create: "Tengeneza",
        add: "Ongeza",
        search: "Tafuta",
        loading: "Inapakia...",
        noResults: "Hakuna matokeo",
        confirm: "Thibitisha",
        close: "Funga",
        back: "Rudi",
        view: "Angalia",
        export: "Hamisha",
        share: "Share",
        upgrade: "Boresha",
        settings: "Mipangilio",
        changePlan: "Badilisha mpango",
        viewing: "Unaangalia:",
        actions: "Vitendo",
        status: "Hali",
        date: "Tarehe",
        amount: "Kiasi",
        total: "Jumla",
        name: "Jina",
        description: "Maelezo",
        notes: "Maelezo",
        yes: "Ndiyo",
        no: "Hapana",
        all: "Zote",
        filter: "Chuja",
        clear: "Futa",
        refresh: "Onyesha upya",
        download: "Pakua",
        print: "Chapisha",
        copy: "Nakili",
        copied: "Imenakiliwa",
        required: "Inahitajika",
        optional: "Si lazima",
        continue: "Endelea",
        submit: "Wasilisha",
        update: "Sasisha",
        remove: "Ondoa",
        select: "Chagua",
        none: "Hakuna",
        error: "Hitilafu",
        success: "Imefanikiwa",
        saving: "Inahifadhi...",
        deleting: "Inafuta...",
        recordSale: "Rekodi Mauzo",
        recordExpense: "Rekodi Matumizi",
        addClient: "Ongeza Mteja",
        addProduct: "Ongeza Bidhaa",
        viewAll: "Angalia zote",
        seeMore: "Ona zaidi",
        empty: "Hakuna data",
        from: "Kutoka",
        to: "Hadi",
        today: "Leo",
        thisMonth: "Mwezi huu",
        stock: "Stock",
        quantity: "Idadi",
        price: "Bei",
        profit: "Faida",
        cost: "Gharama",
        subtotal: "Jumla ndogo",
        tax: "Kodi",
        discount: "Punguzo",
        currency: "Sarafu",
        phone: "Simu",
        email: "Barua pepe",
        address: "Anwani",
        type: "Aina",
        product: "Bidhaa",
        service: "Huduma",
        active: "Hai",
        inactive: "Isiyotumika",
        primary: "Kuu",
        ...dashboardCommonExtra.sw,
      },
      status: {
        draft: "Draft",
        sent: "Imetumwa",
        paid: "Imelipwa",
        overdue: "Imechelewa",
        viewed: "Imetazamwa",
        accepted: "Imekubaliwa",
        expired: "Imeisha muda",
        cancelled: "Imefutwa",
        pending: "Inasubiri",
        completed: "Imekamilika",
        active: "Hai",
        inactive: "Isiyotumika",
        ...dashboardStatusExtra.sw,
      },
      home: {
        greetingSubtitle: "Tayari kurekodi mauzo, kufuatilia stock na kuona faida.",
        completeProfileTitle: "Kamilisha wasifu wako",
        completeProfileDescription:
          "Maliza kuongeza maelezo yako ili uanze kurekodi mauzo na kusimamia biashara yako.",
        completeProfileCta: "Kamilisha wasifu",
      },
      toast: dashboardToast.sw,
      ...dashboardFeatures.sw,
    },
    productCatalog: {
      columns: {
        productName: "Jina la Bidhaa",
        description: "Maelezo",
        sellingPricePerItem: "Bei kwa Kipande/Dazeni/Bidhaa",
      },
      export: {
        includeTitle: "Jumuisha kwenye orodha",
        includeDescription: "Maelezo",
        includePrice: "Bei kwa Kipande/Dazeni/Bidhaa",
        nameAlwaysIncluded: "Jina la bidhaa linaongezwa kila wakati.",
      },
      share: {
        message:
          "Habari! Nimeshare nawe list bidhaa na bei husika toka {businessName}. Angalia document niliotuma. Asante",
        emailSubject: "{businessName} — Orodha ya Bidhaa na Bei",
        nativeShareTitle: "{businessName} — Orodha ya Bidhaa na Bei",
        nativeShareText:
          "Habari! Nimeshare nawe list bidhaa na bei husika toka {businessName}. Angalia document niliotuma. Asante",
      },
    },
    footer: {
      tagline: `${APP_NAME} · POS mtandaoni rahisi kwa biashara zinazokua`,
      description:
        "Usimamizi wa biashara mtandaoni kwa biashara zinazokua. Mauzo, stock, invoisi, matumizi, mikopo na faida halisi — mahali pamoja.",
      company: "Kampuni",
      aboutUs: "Kuhusu Sisi",
      resources: "Rasilimali",
      helpCenter: "Kituo cha Msaada",
      termsOfService: "Vigezo vya Huduma",
      privacyPolicy: "Sera ya Faragha",
      deleteAccount: "Futa Akaunti",
      connect: "Unganisha",
      socialWhatsApp: "WhatsApp",
      socialFacebook: "Facebook",
      socialInstagram: "Instagram",
      copyright: `© 2026 ${APP_NAME}. Haki zote zimehifadhiwa.`,
      privacy: "Faragha",
      terms: "Vigezo",
      support: "Msaada",
    },
    about: {
      title: `Kuhusu ${APP_NAME}`,
      subtitle: "POS, mauzo, stock na invoisi kwa biashara zinazokua.",
      missionTitle: "Lengo letu",
      missionContent:
        "Kuwapa wafanyabiashara mfumo rahisi wa kurekodi mauzo, kusimamia bidhaa na huduma, kutengeneza invoisi na quotations, na kuelewa faida ya biashara bila mfumo mzito wa accounting.",
      visionTitle: "Maono",
      visionContent:
        "Kuwa jukwaa rahisi la POS na usimamizi wa biashara linalotegemewa na maduka, watoa huduma na biashara ndogo na za kati barani Afrika.",
      valuesTitle: "Thamani zetu",
      value1Title: "Rahisi",
      value1Description:
        "Fomu fupi, vitendo vya haraka na taarifa zinazoeleweka kwa mtu yeyote anayeendesha biashara.",
      value2Title: "Kuaminika",
      value2Description: "Data yako ni ya siri na imara; tunajenga imani kwa usalama na uwazi.",
      value3Title: "Kwa Afrika",
      value3Description:
        "Imejengwa kwa mahitaji ya biashara za Kiafrika: mauzo ya kila siku, stock, wateja na ripoti rahisi.",
      teamTitle: "Timu yetu",
      teamDescription:
        "Tunaongozwa na watu wenye uzoefu wa biashara na teknolojia. Tunafanya kazi karibu na wafanyabiashara ili kujenga zana zinazojibu kazi zao za kila siku.",
      contactTitle: "Wasiliana nasi",
      contactDescription: "Una maswali au maoni? Tuma barua pepe kwa timu yetu.",
    },
    support: {
      title: "Msaada",
      description:
        "Unahitaji msaada kuhusu mauzo, stock ya bidhaa, invoisi au akaunti yako? Tupo hapa. Kwa sasa, tafadhali wasiliana nasi kwa barua pepe.",
      faqTitle: "Maswali Yanayoulizwa Mara kwa Mara",
      faq1Question: "Ninawezaje kurekodi sale yangu ya kwanza?",
      faq1Answer:
        "Ingia kwenye dashibodi, fungua Mauzo, kisha gusa Rekodi Mauzo. Chagua bidhaa au huduma, thibitisha idadi na bei, kisha hifadhi muamala.",
      faq2Question: "Ninawezaje kuongeza bidhaa au huduma?",
      faq2Answer:
        "Nenda Stock ya bidhaa, gusa Ongeza kipengee, chagua Bidhaa au Huduma, kisha weka bei ya msingi, bei ya kuuza na idadi ya stock ikiwa ni bidhaa.",
      faq3Question: "Naweza kubadili invoice kuwa sale?",
      faq3Answer:
        "Ndiyo, kwa invoisi zilizotumwa, zilizotazamwa, au tayari zimelipwa (sio draft, zilizofutwa, au zilizochelewa). Tumia Geuza kuwa mauzo kwenye invoisi au menyu ya safu. Zilizotumwa au zilizotazamwa zitaonyeshwa kama zimelipwa unapogeuzwa. Mauzo huundwa mara moja kwa kila invoisi.",
      faq4Question: "Stock inapungua vipi baada ya sale?",
      faq4Answer:
        "Kwa bidhaa, idadi ya stock hupunguzwa unapohifadhi mauzo. Huduma hazipunguzi stock, lakini bado zinaonekana katika historia ya mauzo.",
      faq5Question: "Mipaka ya mpango wa bure ni ipi?",
      faq5Answer:
        "Mpango wa bure una vikomo vya matumizi kama idadi ya invoisi, wateja, bidhaa/huduma na biashara. Pata mpango wa Pro unapohitaji uwezo zaidi.",
      faq6Question: "Ninawezaje kuona mapato na faida?",
      faq6Answer:
        "Dashibodi inaonyesha jumla ya mauzo, faida, thamani ya stock, mauzo ya leo na faida ya leo. Historia ya mauzo pia hukuruhusu kuchuja kwa tarehe.",
      stillNeedHelp: "Bado unahitaji msaada?",
      stillNeedHelpDescription: "Ikiwa hukupata jibu hapa, timu yetu iko tayari kukusaidia.",
      contactSupport: "Wasiliana na Msaada",
      contactsTitle: "Mawasiliano",
      emailLabel: "Barua pepe",
      phoneLabel: "Simu",
    },
    terms: {
      title: "Vigezo vya Huduma",
      lastUpdated: "Ilisasishwa mwisho: Machi 2025",
      introduction:
        "Karibu kwenye " +
        APP_NAME +
        ". Tafadhali soma vigezo hivi vya huduma kwa makini kabla ya kutumia jukwaa letu. Kwa kutumia " +
        APP_NAME +
        ", unakubali kufuata vigezo hivi.",
      section1Title: "Kukubali vigezo",
      section1Content:
        "Kwa kusajili na kutumia jukwaa la " +
        APP_NAME +
        ", unakubali kufuata na kufungwa na vigezo hivi vya huduma. Ikiwa haukubali vigezo hivi, tafadhali usitumie jukwaa letu.",
      section2Title: "Huduma zetu",
      section2Content:
        APP_NAME +
        " inatoa jukwaa la POS na usimamizi wa biashara: kurekodi mauzo, kusimamia stock, wateja, quotations na invoisi. Tunahifadhi data yako kwa usalama na kufuata sera yetu ya faragha.",
      section3Title: "Matumizi yanayokubalika",
      section3Content:
        "Unakubali kutotumia jukwaa kwa shughuli zisizo halali, kudanganya, au kukiuka sheria. Tunaruhusu kusitisha au kukatisha akaunti yako ikiwa unakiuka vigezo au tabia isiyokubalika.",
      section4Title: "Mali ya kiakili na data",
      section4Content:
        "Maudhui unayounda (mauzo, bidhaa, wateja, invoisi, quotations na maelezo ya biashara) ni yako. Unatupatia leseni ya kutumia na kuonyesha data hiyo ili kutoa huduma. Tutaheshimu faragha yako kama ilivyoelezwa kwenye Sera ya Faragha.",
      section5Title: "Mabadiliko ya vigezo",
      section5Content:
        "Tunaweza kusasisha vigezo hivi wakati wowote. Tutawataarifu watumiaji endapo kutakuwa na mabadiliko makubwa. Kuendelea kutumia jukwaa baada ya mabadiliko kunamaanisha unakubali vigezo vipya.",
      section6Title: "Wasiliana",
      section6Content:
        "Kama una maswali kuhusu vigezo hivi vya huduma, tafadhali wasiliana nasi kwa barua pepe ya msaada.",
      contactTitle: "Wasiliana nasi",
      contactDescription: "Kwa maswali kuhusu vigezo vya huduma, wasiliana nasi.",
    },
    privacy: {
      title: "Sera ya Faragha",
      lastUpdated: "Ilisasishwa mwisho: Machi 2025",
      introduction:
        APP_NAME +
        " inajali faragha yako. Sera hii ya faragha inaeleza jinsi tunavyokusanya, kutumia na kulinda taarifa zako za kibinafsi.",
      section1Title: "Taarifa tunazokusanya",
      section1Content:
        "Tunakusanya jina, barua pepe, nambari ya simu, maelezo ya biashara, wateja, bidhaa/huduma, mauzo, invoisi na quotations unazoongeza kwenye mfumo.",
      section2Title: "Jinsi tunavyotumia taarifa",
      section2Content:
        "Tunatumia taarifa zako kuendesha akaunti yako, kuonyesha mauzo, stock, wateja, invoisi na ripoti, na kuboresha jukwaa. Tunaweza kutumia barua pepe au simu kwa arifa muhimu kuhusu akaunti na huduma zetu.",
      section3Title: "Kushiriki taarifa",
      section3Content:
        "Hatushiriki taarifa zako za kibinafsi na watu wa nje kwa madhumuni ya matangazo. Taarifa za invoisi au quotation zinaweza kuonekana kwa mteja pale unapotuma au kushiriki hati hiyo - ni sehemu ya huduma.",
      section4Title: "Usalama",
      section4Content:
        "Tunachukua hatua za kiusalama kulinda data yako (mfumo wa usimbaji fiche, idadi ndogo ya watumiaji wenye ruhusa). Unapaswa kuweka nenosiri lako kwa usalama na kutuarifu mara moja ikiwa una mashaka kuhusu akaunti yako.",
      section5Title: "Haki zako",
      section5Content:
        "Unaweza kufikia na kusahihisha taarifa zako za wasifu kutoka kwenye Mipangilio. Unaweza kutuomba kufuta akaunti na data yako kwa kushughulikia msaada.",
      section6Title: "Mabadiliko",
      section6Content:
        "Tunaweza kusasisha sera hii ya faragha. Tutawataarifa watumiaji kuhusu mabadiliko muhimu. Kuendelea kutumia jukwaa kunamaanisha unakubali sera iliyosasishwa.",
      contactTitle: "Wasiliana nasi",
      contactDescription:
        "Ikiwa una maswali kuhusu sera hii ya faragha, tafadhali wasiliana nasi kwa barua pepe ya msaada.",
    },
    deleteAccount: {
      title: "Futa Akaunti Yako",
      lastUpdated: "Ilisasishwa mwisho: Juni 2026",
      introduction:
        "Unaweza kufuta kabisa akaunti yako ya " +
        APP_NAME +
        " pamoja na data yote wakati wowote, moja kwa moja kutoka kwenye programu ya simu. Ukurasa huu unaeleza jinsi ya kufanya hivyo, na ni data gani hasa inayofutwa.",
      inAppTitle: "Futa akaunti yako kutoka kwenye programu",
      step1: "Fungua programu ya " + APP_NAME + " na uingie kwenye akaunti yako.",
      step2: "Nenda kwenye kichupo cha Wasifu (Profile).",
      step3: 'Telezesha chini na ubonyeze "Futa akaunti".',
      step4:
        "Thibitisha onyo, kisha weka namba ya uthibitisho (OTP) iliyotumwa kwenye simu yako.",
      step5: "Akaunti yako na data yote zitafutwa mara moja na utatolewa nje.",
      deletedTitle: "Ni nini kinachofutwa",
      deletedContent:
        "Kufuta akaunti yako kunaondoa kabisa wasifu wako, biashara zote unazomiliki, na kila kitu ndani yake — bidhaa na stock, mauzo, wateja, invoisi, nukuu, mikopo, gharama, wafanyakazi, usajili, nembo za biashara zilizopakiwa, na arifa. Kitendo hiki hakiwezi kutenduliwa.",
      retentionTitle: "Uhifadhi wa data",
      retentionContent:
        "Data yako huondolewa kwenye mifumo yetu ya moja kwa moja papo hapo. Nakala zilizobaki kwenye chelezo (backups) zilizosimbwa hufutwa ndani ya siku 30. Tunaweza kuhifadhi kumbukumbu chache pale tu inapohitajika kisheria.",
      supportTitle: "Ungependa tukufutie?",
      supportContent:
        "Ikiwa huwezi kufikia programu, tutumie barua pepe kutoka anwani au namba ya simu iliyounganishwa na akaunti yako nasi tutashughulikia ombi lako. Jumuisha namba ya simu ya akaunti yako ili tuweze kuthibitisha utambulisho wako.",
      contactTitle: "Wasiliana nasi",
      contactDescription:
        "Kwa maswali yoyote kuhusu kufuta akaunti, wasiliana na timu yetu ya msaada.",
    },
    landing: {
      tagline: `${APP_NAME} · POS mtandaoni rahisi kwa biashara zinazokua`,
      headline: "Fahamu Biashara Yako Inayokua Inaendelea Vipi",
      subheadline:
        "Mauzo, matumizi na faida halisi katika mfumo mmoja rahisi mtandaoni. POS unayoweza kuitegemea kwa biashara inayokua kwa gharama nafuu.",
      supportingText: "Anza bure. Panda daraja unapokua.",
      cta: "Anza Bure",
      ctaDashboard: "Nenda kwenye Dashibodi",
      heroLabel: "POS Mtandaoni kwa Biashara Zinazokua",
      noCreditCard: "Hakuna kadi ya malipo inayohitajika · Anza bure",
      socialProof: "Biashara zinazokua zinapenda uwazi na urahisi, si programu ngumu",
      trustedBy: "Inaaminika na maduka, watoa huduma na biashara zinazokua",
      trustMetrics: {
        salesValue: "Mauzo",
        salesLabel: "POS",
        expensesValue: "Matumizi",
        expensesLabel: "Kila siku",
        profitValue: "Faida",
        profitLabel: "Halisi",
      },
      testimonials: {
        one: {
          quoteStart: "Sasa tunaona ",
          quoteHighlight: "mauzo na faida",
          quoteEnd: " bila kupitia madaftari kila mwisho wa siku.",
          name: "Sarah N.",
          affiliation: "Mmiliki wa duka",
        },
        two: {
          quoteStart: "Huduma zote nazotoa",
          quoteHighlight: "zipo sehemu moja",
          quoteEnd: ", nachofanya mm natengenza invoice, kutuma kwa wateja na kusubiri malipo.",
          name: "Jonathan S.",
          affiliation: "Mtoa huduma",
        },
        three: {
          quoteStart: "Tunarekodi mikopo na matumizi ",
          quoteHighlight: "bila vitabu vya ziada",
          quoteEnd: ", na tunajua faida halisi kila siku.",
          name: "Tiffany W.",
          affiliation: "Biashara inayokua",
        },
      },
      secondaryCta: "Jifunze Zaidi",
      storeButtons: {
        appStoreLabel: "Pakua kutoka",
        appStoreName: "App Store",
        googlePlayLabel: "Ipate kwenye",
        googlePlayName: "Google Play",
      },
      mobileShowcase: {
        badge: "Programu ya simu",
        title: "Endesha biashara yako popote ulipo",
        subtitle:
          "Pakua programu ya Ankaara kwenye simu yako—rekodi mauzo, fuatilia stock, na uone faida halisi ukiwa njiani.",
        pointOne: "Rekodi mauzo na matumizi kwa sekunde chache",
        pointTwo: "Ona dashibodi ya faida wakati wowote, popote",
        pointThree: "Inafanya kazi kwa Android na iOS",
        imageAlt: "Programu ya Ankaara ikionyeshwa kwenye simu",
      },
      simpleSection: {
        title: "Kila kitu unachohitaji kuendesha duka lako",
        recordSales: "Rekodi mauzo ya bidhaa au huduma kwa sekunde chache",
        manageInventory: "Fuatilia stock, restock na historia ya bidhaa",
        invoicesAndQuotes: "Tengeneza quotations na invoisi, kisha badili zilizolipwa kuwa mauzo",
        clientLoans:
          "Toa mikopo kwa wateja, rekodi malipo, na mikopo iliyolipwa inabadilika mauzo kiotomatiki",
        trackExpenses: "Andika matumizi ya kila siku kwa makundi ili ujue ulitumia nini",
        profitDashboard: "Ona mauzo, gharama, matumizi na faida halisi kwa leo au muda wowote",
      },
      features: {
        title: "POS rahisi kwa biashara yako",
        subtitle: `${APP_NAME} inakuletea smart POS, matumizi na faida katika mfumo mmoja rahisi.`,
        recordSales: {
          title: "Mauzo na POS",
          description:
            "Rekodi mauzo ya dukani, huduma, na mauzo kutoka invoisi—na uone mapato na faida kwa kila muuzo.",
        },
        inventory: {
          title: "Stock na bidhaa",
          description:
            "Simamia bidhaa na huduma, fuatilia stock, na ona historia ya harakati za bidhaa.",
        },
        invoicesQuotations: {
          title: "Invoisi na quotations",
          description:
            "Tengeneza invoisi na quotations za kitaalamu, shiriki na wateja, na badili zilizolipwa kuwa mauzo.",
        },
        clientLoans: {
          title: "Mikopo ya wateja",
          description:
            "Toa bidhaa kwa mkopo, rekodi malipo ya sehemu, tengeneza invoisi kutoka mkopo, na ubadilishe mikopo iliyokamilika kuwa mauzo.",
        },
        trackExpenses: {
          title: "Matumizi ya kila siku",
          description:
            "Andika matumizi kwa makundi—rent, usafiri, mishahara na zaidi—na chagua Nyingine kwa matumizi maalum.",
        },
        profitDashboard: {
          title: "Dashibodi ya faida",
          description:
            "Angalia mapato, gharama za bidhaa, matumizi, na faida halisi kwa leo, mwezi huu, au muda wowote.",
        },
        monthlyReports: {
          title: "Ripoti za Kila Mwezi",
          description:
            "Zalisha ripoti za kila mwezi na ujipatie maoni ya haraka kuhusu utendaji wa biashara yako.",
        },
        traReady: {
          title: "Tayari kwa TRA",
          description: "Andaa rekodi zako kwa TRA kwa urahisi. Kukusaidia tu, siyo kufanya malipo.",
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
        subtitle: "Vifaa vyetu vinakusaidia kufanya kazi yako iwe rahisi na wazi.",
        fast: {
          title: "Haraka na Rahisi",
          description: "Rekodi mauzo yako chini ya sekunde 5. Fomu rahisi na za haraka.",
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
          title: "Uwazi na uelewevu",
          description: "Angalia muhtasari wakati wowote. Taarifa zote ni wazi na rahisi kuzielewa.",
        },
      },
      problem: {
        title: "Biashara Nyingi Haziogopi TRA — Huogopa Kukosa Rekodi",
        intro: "Wafanyabiashara wengi hupata wasiwasi kwa sababu:",
        painPoints: {
          salesNotRecorded: "Mauzo hayajaandikwa vizuri",
          expensesUnknown: "Matumizi hayajulikani wazi",
          noSummary: "Hakuna muhtasari wa kila mwezi",
          incompleteRecords: "Taarifa zipo kwenye daftari au kumbukumbu zisizo kamili",
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
        closing: "Hakuna kubahatisha. Hakuna msongo wa mawazo.",
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
          noReplaceAccountant: "Si mbadala wa mhasibu wako",
          noBankAccess: "Haipati kufikia akaunti za benki au pesa za simu",
          noMoneyHandling: "Haihamishi, haikusanyi, au haihifadhi pesa",
        },
        closing: `${APP_NAME} inakusaidia kuweka mipango na kuandaa — hakuna zaidi, hakuna kilichofichwa.`,
      },
      pricing: {
        title: "Bei rahisi kwa biashara yako",
        noHiddenFees: "Hakuna ada zisizojulikana.",
        poweredBy: "Malipo yenye usalama kwa",
        mostPopular: "Maarufu zaidi",
        freeDefaultNote: "Bure — chaguo-msingi kwa akaunti mpya",
        contactUs: "Wasiliana nasi",
        free: {
          name: "Mpango wa Bure",
          description: "Anza kurekodi mauzo, bidhaa, wateja na invoisi za msingi.",
          price: "TZS 0",
          period: "/mwezi",
          cta: "Chagua mpango huu",
          features: [
            "Biashara 1",
            "Mauzo 10 kwa mwezi",
            "Invoisi 5 kwa mwezi",
            "Bidhaa au huduma 10 kwa biashara",
            "Wateja 10 kwa biashara",
            "Quotations 10 kwa mwezi",
          ],
        },
        pro: {
          name: "Mpango wa Pro",
          description:
            "Kwa biashara zinazokua — mauzo yasiyo na kikomo, wateja wasio na kikomo, na bidhaa 50.",
          price: "24,000",
          period: "/mwezi",
          cta: "Chagua mpango huu",
          features: [
            "Biashara zisizo na kikomo",
            "Mauzo yasiyo na kikomo",
            "Invoisi 50 kwa mwezi",
            "Bidhaa au huduma 50 kwa biashara",
            "Wateja wasio na kikomo",
            "Quotations zisizo na kikomo",
          ],
        },
        business: {
          name: "Mpango wa Biashara",
          description: "Kwa timu na biashara zenye matawi, bidhaa nyingi na mahitaji maalum.",
          price: "54,000",
          period: "/mwezi",
          cta: "Chagua mpango huu",
          features: [
            "Biashara zisizo na kikomo",
            "Mauzo yasiyo na kikomo",
            "Invoisi zisizo na kikomo",
            "Bidhaa na huduma zisizo na kikomo",
            "Wateja wasio na kikomo",
            "Quotations zisizo na kikomo",
          ],
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
        title: "Anza kujua biashara yako inaendaje",
        subtitle:
          "Fungua akaunti bure na simamia mauzo, matumizi na faida kutoka dashibodi moja rahisi.",
        cta: "Anza bure leo",
      },
    },
    auth: {
      common: {
        backToHome: "Rudi mwanzo",
        phonePlaceholder: "Ingiza nambari ya simu (mf. 07XXXXXXXX)",
        phoneHint: "Nambari ya simu lazima ianze na 0 na tarakimu pekee.",
        completingSignIn: "Inakamilisha kuingia...",
        legalPartBeforeTerms: "Kwa kuendelea, unakubali ",
        legalBetweenPolicies: " na ",
        legalAfterPolicies:
          " ya {appName}, na unaweza kupokea barua pepe zenye taarifa ikiwa umejiandikisha.",
        testimonialQuote:
          "{appName} inaendesha duka langu- naona mauzo, stock iliopo, wateja wangu, invoisi na matumizi ya kila siku. Ninaona faida halisi kila siku bila kuhangaika na madaftari.",
      },
      onboarding: {
        title: "Karibu! Ongeza Maelezo Yako",
        subtitle: "Ongeza maelezo machache ya biashara yako ili uanze",
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
        phoneOptional: "Nambari ya simu",
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
        terms: `Kwa kuendelea, unakubali Vigezo vya Huduma na Sera ya Faragha ya ${APP_NAME}.`,
        error: "Hitilafu imetokea. Hakikisha nambari ya simu kisha jaribu tena.",
        noAccountDialogTitle: "Hakuna akaunti",
        noAccountDialogDescription:
          "Hakuna akaunti iliyounganishwa na nambari hii ya simu. Jisajili ili kuunda akaunti, kisha uthibitishwe kwa OTP.",
        goToRegister: "Nenda kusajili",
        cancel: "Ghairi",
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
        terms: `Kwa kuendelea, unakubali Vigezo vya Huduma na Sera ya Faragha ya ${APP_NAME}.`,
        error: "Haikuweza kusajili. Tafadhali jaribu tena.",
        fillAllFields: "Tafadhali jaza sehemu zote",
        emailRequired: "Barua pepe inahitajika",
        phoneRequired: "Nambari ya simu inahitajika",
        accountExistsDialogTitle: "Akaunti tayari ipo",
        accountExistsDialogDescription:
          "Nambari hii ya simu tayari ina akaunti. Ingia badala yake ili kuendelea.",
        goToLogin: "Nenda kuingia",
        cancel: "Ghairi",
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
      tagline: "POS, Sales and Invoicing Made Simple",
      howItWorks: "How It Works",
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      login: "Login",
      signup: "Sign Up",
      dashboard: "Dashboard",
      logout: "Logout",
      language: "Language",
      goToDashboard: "Go to dashboard",
      accountRole: {
        owner: "Owner",
        manager: "Manager",
        accountant: "Accountant",
        salesperson: "Salesperson",
      },
    },
    greeting: {
      morning: "Good Morning 🌅",
      afternoon: "Good Afternoon ☀️",
      evening: "Good Evening 🌆",
      night: "Good Night 🌙",
    },
    dashboard: {
      nav: {
        title: "Dashboard",
        groupMain: "Main",
        groupInvoices: "Invoices",
        groupQuotations: "Quotations",
        groupAccount: "Account",
        overview: "Overview",
        sales: "Sales",
        profits: "Profits",
        reports: "Reports",
        inventory: "Inventory",
        clients: "Clients",
        loans: "Loans",
        expenses: "Expenses",
        staff: "Staff",
        invoices: "Invoices",
        allInvoices: "All Invoices",
        createInvoice: "Create Invoice",
        quotations: "Quotations",
        allQuotations: "All Quotations",
        createQuotation: "Create Quotation",
        invoiceTemplates: "Invoice Templates",
        profile: "Profile",
        businesses: "Businesses",
      },
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        add: "Add",
        search: "Search",
        loading: "Loading...",
        noResults: "No results",
        confirm: "Confirm",
        close: "Close",
        back: "Back",
        view: "View",
        export: "Export",
        share: "Share",
        upgrade: "Upgrade",
        settings: "Settings",
        changePlan: "Change plan",
        viewing: "Viewing:",
        actions: "Actions",
        status: "Status",
        date: "Date",
        amount: "Amount",
        total: "Total",
        name: "Name",
        description: "Description",
        notes: "Notes",
        yes: "Yes",
        no: "No",
        all: "All",
        filter: "Filter",
        clear: "Clear",
        refresh: "Refresh",
        download: "Download",
        print: "Print",
        copy: "Copy",
        copied: "Copied",
        required: "Required",
        optional: "Optional",
        continue: "Continue",
        submit: "Submit",
        update: "Update",
        remove: "Remove",
        select: "Select",
        none: "None",
        error: "Error",
        success: "Success",
        saving: "Saving...",
        deleting: "Deleting...",
        recordSale: "Record Sale",
        recordExpense: "Record Expense",
        addClient: "Add Client",
        addProduct: "Add Product",
        viewAll: "View all",
        seeMore: "See more",
        empty: "No data",
        from: "From",
        to: "To",
        today: "Today",
        thisMonth: "This month",
        stock: "Stock",
        quantity: "Quantity",
        price: "Price",
        profit: "Profit",
        cost: "Cost",
        subtotal: "Subtotal",
        tax: "Tax",
        discount: "Discount",
        currency: "Currency",
        phone: "Phone",
        email: "Email",
        address: "Address",
        type: "Type",
        product: "Product",
        service: "Service",
        active: "Active",
        inactive: "Inactive",
        primary: "Primary",
        ...dashboardCommonExtra.en,
      },
      status: {
        draft: "Draft",
        sent: "Sent",
        paid: "Paid",
        overdue: "Overdue",
        viewed: "Viewed",
        accepted: "Accepted",
        expired: "Expired",
        cancelled: "Cancelled",
        pending: "Pending",
        completed: "Completed",
        active: "Active",
        inactive: "Inactive",
        ...dashboardStatusExtra.en,
      },
      home: {
        greetingSubtitle: "Ready to record sales, track stock and understand profit.",
        completeProfileTitle: "Complete your profile",
        completeProfileDescription:
          "Finalize adding your details to start recording sales and managing your business.",
        completeProfileCta: "Complete profile",
      },
      toast: dashboardToast.en,
      ...dashboardFeatures.en,
    },
    productCatalog: {
      columns: {
        productName: "Product Name",
        description: "Description",
        sellingPricePerItem: "Piece/Dozen/Item Price",
      },
      export: {
        includeTitle: "Include in catalog",
        includeDescription: "Description",
        includePrice: "Piece/Dozen/Item Price",
        nameAlwaysIncluded: "Product name is always included.",
      },
      share: {
        message:
          "Hello! Here is the product and price catalog from {businessName}. See the document attached. Thanks",
        emailSubject: "{businessName} — Product Catalog",
        nativeShareTitle: "{businessName} — Product Catalog",
        nativeShareText:
          "Hello! Here is the product and price catalog from {businessName}. See the document attached. Thanks",
      },
    },
    footer: {
      tagline: `${APP_NAME} · Simple online POS for growing businesses`,
      description:
        "Simple online business management for growing businesses. Sales, inventory, invoices, expenses, loans, and real profit—all in one place.",
      company: "Company",
      aboutUs: "About Us",
      resources: "Resources",
      helpCenter: "Help Center",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      deleteAccount: "Delete Account",
      connect: "Connect",
      socialWhatsApp: "WhatsApp",
      socialFacebook: "Facebook",
      socialInstagram: "Instagram",
      copyright: `© 2026 ${APP_NAME}. All rights reserved.`,
      privacy: "Privacy",
      terms: "Terms",
      support: "Support",
    },
    about: {
      title: `About ${APP_NAME}`,
      subtitle: "POS, sales, inventory and invoicing for growing businesses.",
      missionTitle: "Our mission",
      missionContent:
        "To give business owners a simple way to record sales, manage products and services, create invoices and quotations, and understand profit without heavy accounting software.",
      visionTitle: "Our vision",
      visionContent:
        "To become the simple POS and business-management platform trusted by shops, service providers, and small and medium businesses across Africa.",
      valuesTitle: "Our values",
      value1Title: "Simple",
      value1Description:
        "Short forms, fast actions, and clear numbers for anyone running a business.",
      value2Title: "Trustworthy",
      value2Description:
        "Your data is private and secure; we build trust through security and transparency.",
      value3Title: "Built for Africa",
      value3Description:
        "Designed around everyday African business needs: sales, stock, customers and simple reports.",
      teamTitle: "Our team",
      teamDescription:
        "We are driven by people with experience in business and technology. We work closely with business owners to build tools that fit daily operations.",
      contactTitle: "Contact us",
      contactDescription: "Have questions or feedback? Email our team.",
    },
    support: {
      title: "Support",
      description:
        "Need help with sales, inventory, invoices or your account? We are here. For now, please contact us by email.",
      faqTitle: "Frequently Asked Questions",
      faq1Question: "How do I record my first sale?",
      faq1Answer:
        "Log in to the dashboard, open Sales, then click Record Sale. Choose a product or service, confirm quantity and price, then save the sale.",
      faq2Question: "How do I add a product or service?",
      faq2Answer:
        "Go to Inventory, click Add Item, choose Product or Service, then add base price, selling price and stock when the item is a product.",
      faq3Question: "Can I convert an invoice into a sale?",
      faq3Answer:
        "Yes, for invoices that are sent, viewed, or already paid (not draft, cancelled, or overdue). Use Convert to sale from the invoice or the row menu. Sent or viewed invoices are marked paid when you convert. The sale is created once per invoice.",
      faq4Question: "How is stock reduced after a sale?",
      faq4Answer:
        "For products, stock is reduced when the sale is saved. Services do not reduce stock, but still appear in sales history.",
      faq5Question: "What are the free plan limits?",
      faq5Answer:
        "The free plan has usage limits such as invoices, clients, products/services and businesses. Upgrade to Pro when you need more capacity.",
      faq6Question: "How do I see revenue and profit?",
      faq6Answer:
        "Your dashboard shows total sales, profit, inventory value, today's sales and today's profit. Sales history also lets you filter by date.",
      stillNeedHelp: "Still need help?",
      stillNeedHelpDescription: "If you didn't find an answer here, our team is ready to help.",
      contactSupport: "Contact support",
      contactsTitle: "Contacts",
      emailLabel: "Email",
      phoneLabel: "Phone",
    },
    terms: {
      title: "Terms of Service",
      lastUpdated: "Last updated: March 2025",
      introduction:
        "Welcome to " +
        APP_NAME +
        ". Please read these terms of service carefully before using our platform. By using " +
        APP_NAME +
        ", you agree to these terms.",
      section1Title: "Acceptance of terms",
      section1Content:
        "By signing up and using the " +
        APP_NAME +
        " platform, you agree to be bound by these terms of service. If you do not agree, please do not use our platform.",
      section2Title: "Our services",
      section2Content:
        APP_NAME +
        " provides a POS and business-management platform for recording sales, managing inventory, clients, quotations and invoices. We store your data securely and in line with our privacy policy.",
      section3Title: "Acceptable use",
      section3Content:
        "You agree not to use the platform for illegal activity, fraud, or to violate any laws. We may suspend or terminate your account if you breach these terms or engage in unacceptable behaviour.",
      section4Title: "Intellectual property and data",
      section4Content:
        "Content you create (sales, products, clients, invoices, quotations and business details) is yours. You grant us a licence to use and display that data to provide the service. We will respect your privacy as set out in our Privacy Policy.",
      section5Title: "Changes to terms",
      section5Content:
        "We may update these terms at any time. We will try to notify users of significant changes. Continued use of the platform after changes means you accept the new terms.",
      section6Title: "Contact",
      section6Content:
        "If you have questions about these terms of service, please contact us at our support email.",
      contactTitle: "Contact us",
      contactDescription: "For questions about terms of service, contact us.",
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: March 2025",
      introduction:
        APP_NAME +
        " cares about your privacy. This privacy policy explains how we collect, use, and protect your personal information.",
      section1Title: "Information we collect",
      section1Content:
        "We collect the name, email, phone number, business details, clients, products/services, sales, invoices and quotations you add to the platform.",
      section2Title: "How we use your information",
      section2Content:
        "We use your information to provide the service, manage your account, display sales, inventory, clients, invoices and reports, and improve the platform. We may use email or phone for important notices about your account and our services.",
      section3Title: "Sharing information",
      section3Content:
        "We do not share your personal information with third parties for their marketing. Invoice or quotation data may be visible to a client when you send or share that document - that is part of the service.",
      section4Title: "Security",
      section4Content:
        "We take security measures to protect your data (encryption, limited access). You should keep your password secure and contact us immediately if you suspect any account compromise.",
      section5Title: "Your rights",
      section5Content:
        "You can access and update your profile information from Settings. You can request account and data deletion by contacting support.",
      section6Title: "Changes",
      section6Content:
        "We may update this privacy policy. We will notify users of significant changes. Continued use of the platform means you accept the updated policy.",
      contactTitle: "Contact us",
      contactDescription:
        "If you have questions about this privacy policy, please contact us at our support email.",
    },
    deleteAccount: {
      title: "Delete Your Account",
      lastUpdated: "Last updated: June 2026",
      introduction:
        "You can permanently delete your " +
        APP_NAME +
        " account and all associated data at any time, directly from the mobile app. This page explains how, and exactly what data is removed.",
      inAppTitle: "Delete your account from the app",
      step1: "Open the " + APP_NAME + " app and sign in.",
      step2: "Go to the Profile tab.",
      step3: 'Scroll down and tap "Delete account".',
      step4:
        "Confirm the warning, then enter the one-time verification code (OTP) sent to your phone.",
      step5: "Your account and all data are deleted immediately and you are signed out.",
      deletedTitle: "What gets deleted",
      deletedContent:
        "Deleting your account permanently removes your profile, all businesses you own, and everything within them — products and inventory, sales, clients, invoices, quotations, loans, expenses, staff members, subscriptions, uploaded business logos, and notifications. This action cannot be undone.",
      retentionTitle: "Data retention",
      retentionContent:
        "Your data is removed from our live systems immediately. Residual copies in encrypted backups are purged within 30 days. We may retain limited records only where required by law.",
      supportTitle: "Prefer we delete it for you?",
      supportContent:
        "If you can't access the app, email us from the address or phone number linked to your account and we will process your deletion request. Include your account phone number so we can verify your identity.",
      contactTitle: "Contact us",
      contactDescription:
        "For any questions about account deletion, contact our support team.",
    },
    landing: {
      tagline: `${APP_NAME} · Simple online POS for growing businesses`,
      headline: "Know How Your Growing Business is Doing",
      subheadline:
        "Sales, expenses, loans, and real profit in one simple online system. A reliable POS for growing businesses that want clarity—not complicated, expensive software.",
      supportingText: "Start free. Upgrade when you grow.",
      cta: `Try ${APP_NAME} free`,
      ctaDashboard: "Go to Dashboard",
      heroLabel: "Online POS for Growing Businesses",
      noCreditCard: "No credit card required · Start free",
      socialProof: "Loved by growing businesses that want clarity, not complexity",
      trustedBy: "Trusted by shops, service providers and growing businesses",
      trustMetrics: {
        salesValue: "Sales",
        salesLabel: "POS",
        expensesValue: "Expenses",
        expensesLabel: "Daily",
        profitValue: "Profit",
        profitLabel: "Real-time",
      },
      testimonials: {
        one: {
          quoteStart: "We can now see ",
          quoteHighlight: "sales and profit",
          quoteEnd: " without going through notebooks at the end of the day.",
          name: "Sarah N.",
          affiliation: "Shop owner",
        },
        two: {
          quoteStart: "All my services and products are ",
          quoteHighlight: "in one place",
          quoteEnd: ", i just create an invoice, send it to the client and that's it.",
          name: "Jonathan S.",
          affiliation: "Service provider",
        },
        three: {
          quoteStart: "We track loans and expenses ",
          quoteHighlight: "without extra notebooks",
          quoteEnd: ", and we know our real profit every day.",
          name: "Tiffany W.",
          affiliation: "Growing business",
        },
      },
      secondaryCta: "Learn more",
      storeButtons: {
        appStoreLabel: "Download on the",
        appStoreName: "App Store",
        googlePlayLabel: "Get it on",
        googlePlayName: "Google Play",
      },
      mobileShowcase: {
        badge: "Mobile app",
        title: "Run your business from anywhere",
        subtitle:
          "Get the Ankaara app on your phone—record sales, track stock, and see real profit while you're on the move.",
        pointOne: "Record sales and expenses in seconds",
        pointTwo: "See your profit dashboard anytime, anywhere",
        pointThree: "Works on both Android and iOS",
        imageAlt: "Ankaara app shown on phones",
      },
      simpleSection: {
        title: "Everything you need to run your shop",
        recordSales: "Record product or service sales in seconds",
        manageInventory: "Track stock, restocks and product movement history",
        invoicesAndQuotes: "Create quotations and invoices, then convert paid ones to sales",
        clientLoans:
          "Offer credit to trusted clients, record repayments, and auto-convert settled loans to sales",
        trackExpenses: "Log daily expenses by category so you always know what you spent",
        profitDashboard: "See sales, costs, expenses and net profit for today or any date range",
      },
      features: {
        title: "Built for real businesses",
        subtitle: `${APP_NAME} brings POS, client loans, expenses and profit together in one simple system.`,
        recordSales: {
          title: "Sales & POS",
          description:
            "Record walk-in sales, services, and invoice conversions—see revenue and profit on every sale.",
        },
        inventory: {
          title: "Inventory & products",
          description:
            "Manage products and services, track stock levels, and review product movement history.",
        },
        invoicesQuotations: {
          title: "Invoices & quotations",
          description:
            "Create professional invoices and quotations, share with clients, and convert paid invoices to sales.",
        },
        clientLoans: {
          title: "Client loans",
          description:
            "Issue goods on credit, record partial payments, generate invoices from loans, and auto-convert fully paid loans to sales.",
        },
        trackExpenses: {
          title: "Daily expenses",
          description:
            "Log expenses by category—rent, transport, salaries and more—with an Other option for custom types.",
        },
        profitDashboard: {
          title: "Profit dashboard",
          description:
            "View revenue, cost of goods, expenses, and net profit for today, this month, or any timeline you choose.",
        },
        monthlyReports: {
          title: "Monthly Reports",
          description:
            "Generate monthly reports and get quick insights into your business performance.",
        },
        traReady: {
          title: "TRA Ready",
          description: "Prepare your records for TRA with ease. We help you prepare, not file.",
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
          description: "Record your sales in under 5 seconds. Simple and quick forms.",
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
          description: "View your summary anytime. Everything is clear and easy to understand.",
        },
      },
      problem: {
        title: "Most Businesses Don't Fear TRA — They Fear Missing Records",
        intro: "Many business owners worry because:",
        painPoints: {
          salesNotRecorded: "Sales are not properly recorded",
          expensesUnknown: "Expenses are not clearly known",
          noSummary: "There is no monthly summary",
          incompleteRecords: "Information is in notebooks or incomplete records",
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
        title: "Simple pricing for your business",
        noHiddenFees: "No hidden fees.",
        poweredBy: "Secure payments by",
        mostPopular: "Most popular",
        freeDefaultNote: "Free — default for new accounts",
        contactUs: "Contact us",
        free: {
          name: "Free Plan",
          description: "Start recording sales, products, clients and basic invoices.",
          price: "$0",
          period: "/month",
          cta: "Choose this plan",
          features: [
            "1 business",
            "10 sales per month",
            "5 invoices per month",
            "10 products or services per business",
            "10 clients per business",
            "10 quotations per month",
          ],
        },
        pro: {
          name: "Pro Plan",
          description:
            "For growing businesses — unlimited sales and clients, plus 50 products or services per business.",
          price: "$9",
          period: "/month",
          cta: "Choose this plan",
          features: [
            "Unlimited businesses",
            "Unlimited sales",
            "50 invoices per month",
            "50 products or services per business",
            "Unlimited clients",
            "Unlimited quotations",
          ],
        },
        business: {
          name: "Business Plan",
          description: "For teams, branches and businesses with larger catalogues or custom needs.",
          price: "54,000",
          period: "/month",
          cta: "Choose this plan",
          features: [
            "Unlimited businesses",
            "Unlimited sales",
            "Unlimited invoices",
            "Unlimited products or services",
            "Unlimited clients",
            "Unlimited quotations",
          ],
        },
      },
      trustCompliance: {
        title: `${APP_NAME} Follows the Law`,
        statements: {
          noTaxEvasion: `${APP_NAME} does not help evade taxes.`,
          noBankConnection: "We do not connect bank or MNO accounts.",
          helpsRecords: "We help businesses have accurate and transparent records.",
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
        title: "Start knowing your business for real",
        subtitle:
          "Create your free account and manage sales, expenses, and profit from one simple online dashboard.",
        cta: "Start free today",
      },
    },
    auth: {
      common: {
        backToHome: "Back to home",
        phonePlaceholder: "Enter your phone number (e.g. 07XXXXXXXX)",
        phoneHint: "Phone number must start with 0 and contain only digits.",
        completingSignIn: "Completing sign in...",
        legalPartBeforeTerms: "By continuing, you agree to {appName}'s ",
        legalBetweenPolicies: " and ",
        legalAfterPolicies: ", and to receive occasional emails with updates if you subscribe.",
        testimonialQuote:
          "{appName} runs my whole shop from one place—POS sales, stock, clients, invoices, and expenses. I see real profit every day without juggling notebooks.",
      },
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
        phoneOptional: "Phone number",
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
        terms: `By continuing, you agree to ${APP_NAME}'s Terms of Service and Privacy Policy.`,
        error: "Something went wrong. Check your phone number and try again.",
        noAccountDialogTitle: "No account found",
        noAccountDialogDescription:
          "There is no account linked to this phone number. Sign up to create one, then verify with OTP.",
        goToRegister: "Go to Register",
        cancel: "Cancel",
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
        terms: `By continuing, you agree to ${APP_NAME}'s Terms of Service and Privacy Policy.`,
        error: "Unable to register. Please try again.",
        fillAllFields: "Please complete all fields",
        emailRequired: "Email is required",
        phoneRequired: "Phone number is required",
        accountExistsDialogTitle: "Account already exists",
        accountExistsDialogDescription:
          "This phone number already has an account. Sign in instead to continue.",
        goToLogin: "Go to Login",
        cancel: "Cancel",
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
const replaceVariables = (value: string, vars: Record<string, string | number> = {}) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)}/g, (_, name) => {
    const v = vars[name];
    return v !== undefined && v !== null ? String(v) : `{${name}}`;
  });
};

// Helper function to resolve nested keys (e.g., "nav.findJobs")
const resolveKey = (lang: keyof typeof translations, key: string): string | undefined => {
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
  vars: Record<string, string | number> = {},
): string => {
  const primary = resolveKey(lang, key);
  const resolved =
    primary !== undefined ? primary : lang !== "en" ? resolveKey("en", key) : undefined;
  const value = resolved !== undefined ? resolved : key;
  return replaceVariables(typeof value === "string" ? value : String(value), vars);
};
