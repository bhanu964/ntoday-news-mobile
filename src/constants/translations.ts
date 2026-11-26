export type AppLanguage = 'te' | 'en';

export const TRANSLATIONS = {
  te: {
    // Header & Bottom Nav
    newsTab: 'న్యూస్',
    unreadTab: 'చదవనివి',
    latest: 'Latest',
    unread: 'Unread',
    feedback: 'Feedback',
    homeBtn: 'హోమ్',
    categoriesBtn: 'న్యూస్+',
    reloadBtn: 'రీలోడ్',
    loadingBtn: 'లోడింగ్...',
    readMore: 'మరింత చదవండి',
    pagesLabel: 'Pages',
    translating: 'అనువదిస్తోంది...',
    bookmarksActive: 'బుక్‌మార్క్స్ మోడ్',
    bookmarksActiveMsg: 'సేవ్ చేసిన వార్తలను చూపిస్తున్నాము.',
    allNewsMsg: 'తిరిగి పూర్తి వార్తలకు వచ్చారు.',
    savedBookmarksBanner: '🔖 సేవ్ చేసిన బుక్‌మార్క్స్',
    categoryBanner: '📂 కేటగిరీ: ',

    // Empty Feed
    allCaughtUpTitle: 'మీరు అన్ని తాజా వార్తలను చదివేశారు! 🎉',
    allCaughtUpSubtitle: 'చదవని వార్తలు లేవు.',
    noNewsTitle: 'వార్తలు అందుబాటులో లేవు',
    noNewsSubtitle: 'ఈ విభాగంలో ప్రస్తుతానికి వార్తలు లేవు.',
    viewAllBtn: 'అన్ని వార్తలను చూడండి (View All)',

    // Card Toolbar & Alerts
    savedToBookmarks: 'బుక్‌మార్క్‌లలో సేవ్ చేయబడింది',
    removedFromBookmarks: 'బుక్‌మార్క్‌ల నుండి తొలగించబడింది',
    sharePrompt: 'పూర్తి వివరాలు NTODAY NEWS లో చదవండి:',

    // Comments Modal
    commentsTitle: 'వ్యాఖ్యలు (Comments)',
    commentsEmptyTitle: 'మొదటి వ్యాఖ్యను మీరే రాయండి!',
    commentsEmptySubtitle: 'మీ అభిప్రాయాన్ని అందరితో పంచుకోండి.',
    commentsPlaceholder: 'మీ అభిప్రాయాన్ని రాయండి (గరిష్టంగా 500 అక్షరాలు)...',
    commentsReaderName: 'నేను (మీరు)',
    commentsRateLimitTitle: 'పరిమితి మించింది',
    commentsRateLimitMsg: 'దయచేసి కొద్దిసేపు ఆగి కామెంట్ చేయండి (1 నిమిషంలో గరిష్టంగా 3 కామెంట్లు మాత్రమే).',

    // Categories Modal
    categoriesTitle: 'కేటగిరీలు ఎంచుకోండి',
    allCategories: 'అన్నీ (All Stories)',
    loadingCategories: 'కేటగిరీలను లోడ్ చేస్తోంది...',

    // Explore View
    searchPlaceholder: 'పాత వార్తలతో సహా అన్ని వార్తలను వెతకండి',
    listenToNewsTitle: 'వార్తలను వినండి',
    listenToNewsSubtitle: 'హ్యాండ్స్-ఫ్రీ ఆడియో వార్తలు, ఒకదాని తర్వాత ఒకటి',
    topNowTitle: 'ట్రెండింగ్ వార్తలు',
    topNowSubtitle: 'ప్రస్తుతం పాఠకులు ఎక్కువగా చదువుతున్నవి',
    playlistsTitle: 'ప్లేలిస్ట్‌లు',
    playlistsSubtitle: 'వరుసగా వార్తా కథనాలు వినండి',

    // Live View
    liveBannerText: 'NTODAY లైవ్ 24x7 న్యూస్ టిక్కర్',
    liveRadioTitle: 'NTODAY లైవ్ ఆడియో స్ట్రీమ్',
    liveRadioSubtitle: 'హైదరాబాద్ స్టూడియో నుండి నేరుగా లైవ్ వినండి',
    liveBreakingUpdates: 'తాజా లైవ్ అప్‌డేట్స్ (Breaking Updates)',
    minutesAgo: 'నిమిషాల క్రితం',

    // Videos View
    videosBadge: 'NTODAY వీడియో',
    videoStarted: 'ప్లేయర్ ప్రారంభమైంది.',

    // Feedback Modal
    feedbackTitle: 'అభిప్రాయం పంపండి (Feedback)',
    feedbackSubtitle: 'మీకు ఏవైనా సూచనలు ఉంటే లేదా సమస్యలు కనిపిస్తే మాకు తెలియజేయండి!',
    feedbackCategoryLabel: 'విభాగం ఎంచుకోండి',
    feedbackRatingLabel: 'NTODAY యాప్ గురించి మీ రేటింగ్?',
    feedbackMessageLabel: 'మీ అభిప్రాయం',
    feedbackPlaceholder: 'మీ అభిప్రాయాన్ని లేదా సమస్యను ఇక్కడ టైప్ చేయండి...',
    feedbackContactLabel: 'సంప్రదింపు వివరాలు (ఐచ్ఛికం - ఇమెయిల్ లేదా ఫోన్)',
    feedbackSendBtn: 'అభిప్రాయం పంపండి',
    feedbackSuccessTitle: 'ధన్యవాదాలు!',
    feedbackSuccessMsg: 'మీ అభిప్రాయం NTODAY డెస్క్‌కు విజయవంతంగా చేరింది. మీ సూచనలు మాకు ఎంతో విలువైనవి!',

    // Account View
    accountTitle: 'ఖాతా (Account)',
    userRole: 'NTODAY పాఠకుడు',
    mySubmissions: 'నా సమర్పణలు',
    savedSection: 'సేవ్ చేసినవి',
    savedBookmarks: 'బుక్‌మార్క్స్',
    savedShorts: 'సేవ్ చేసిన షార్ట్స్',
    preferencesSection: 'ప్రాధాన్యతలు',
    feedAndContent: 'ఫీడ్ & కంటెంట్',
    readingFontSize: 'చదివే ఫాంట్ పరిమాణం',
    moreSection: 'మరిన్ని',
    privacySafety: 'గోప్యత & భద్రత',
    followUs: 'మమ్మల్ని అనుసరించండి',
    myFeedback: 'నా అభిప్రాయం',
    accountSettings: 'ఖాతా వివరాలు',
  },
  en: {
    // Header & Bottom Nav
    newsTab: 'News',
    unreadTab: 'Unread',
    latest: 'Latest',
    unread: 'Unread',
    feedback: 'Feedback',
    homeBtn: 'Home',
    categoriesBtn: 'Categories',
    reloadBtn: 'Reload',
    loadingBtn: 'Loading...',
    readMore: 'Read More',
    pagesLabel: 'Pages',
    translating: 'Translating...',
    bookmarksActive: 'Bookmarks Mode',
    bookmarksActiveMsg: 'Showing your saved stories.',
    allNewsMsg: 'Returned to the complete news feed.',
    savedBookmarksBanner: '🔖 Saved Bookmarks',
    categoryBanner: '📂 Category: ',

    // Empty Feed
    allCaughtUpTitle: "You're all caught up! 🎉",
    allCaughtUpSubtitle: 'No unread news stories remaining.',
    noNewsTitle: 'No Stories Available',
    noNewsSubtitle: 'No articles found in this category right now.',
    viewAllBtn: 'View All Stories',

    // Card Toolbar & Alerts
    savedToBookmarks: 'Saved to Bookmarks',
    removedFromBookmarks: 'Removed from Bookmarks',
    sharePrompt: 'Read the full story on NTODAY NEWS:',

    // Comments Modal
    commentsTitle: 'Comments',
    commentsEmptyTitle: 'Be the first to comment!',
    commentsEmptySubtitle: 'Share your thoughts with the community.',
    commentsPlaceholder: 'Write your comment (max 500 characters)...',
    commentsReaderName: 'Reader (You)',
    commentsRateLimitTitle: 'Rate Limit Reached',
    commentsRateLimitMsg: 'Please wait a moment before posting another comment (maximum 3 per minute).',

    // Categories Modal
    categoriesTitle: 'Select Category',
    allCategories: 'All Stories',
    loadingCategories: 'Loading live categories...',

    // Explore View
    searchPlaceholder: 'Search all news, including older stories',
    listenToNewsTitle: 'Listen to the news',
    listenToNewsSubtitle: 'Hands-free audio news, one story after another',
    topNowTitle: 'Top Now',
    topNowSubtitle: 'Most-read stories right now',
    playlistsTitle: 'Playlists',
    playlistsSubtitle: 'Continuous audio bulletins',

    // Live View
    liveBannerText: 'NTODAY LIVE 24x7 NEWS TICKER',
    liveRadioTitle: 'NTODAY Live Audio Stream',
    liveRadioSubtitle: 'Listen live directly from our Hyderabad studio',
    liveBreakingUpdates: 'Live Breaking Updates',
    minutesAgo: 'min ago',

    // Videos View
    videosBadge: 'NTODAY VIDEO',
    videoStarted: 'Video playback started.',

    // Feedback Modal
    feedbackTitle: 'Submit Feedback',
    feedbackSubtitle: 'Have a suggestion or spotted an issue? Let us know!',
    feedbackCategoryLabel: 'Select Category',
    feedbackRatingLabel: 'How would you rate the NTODAY App?',
    feedbackMessageLabel: 'Your Feedback',
    feedbackPlaceholder: 'Type your message or feedback here...',
    feedbackContactLabel: 'Contact Info (Optional - Email or Phone)',
    feedbackSendBtn: 'Send Feedback',
    feedbackSuccessTitle: 'Thank You!',
    feedbackSuccessMsg: 'Your feedback has been sent to the NTODAY editorial desk.',

    // Account View
    accountTitle: 'Account',
    userRole: 'NTODAY Reader',
    mySubmissions: 'My Submissions',
    savedSection: 'SAVED',
    savedBookmarks: 'Bookmarks',
    savedShorts: 'Saved Shorts',
    preferencesSection: 'PREFERENCES',
    feedAndContent: 'Feed & Content',
    readingFontSize: 'Reading Font Size',
    moreSection: 'MORE',
    privacySafety: 'Privacy & Safety',
    followUs: 'Follow Us',
    myFeedback: 'My Feedback',
    accountSettings: 'Account Settings',
  },
} as const;
