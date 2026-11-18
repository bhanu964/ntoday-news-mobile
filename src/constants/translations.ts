export type AppLanguage = 'te' | 'en';

export const TRANSLATIONS = {
  te: {
    // Header
    latest: 'Latest',
    unread: 'Unread',
    feedback: 'Feedback',
    bookmarksActive: 'బుక్‌మార్క్స్ మోడ్',
    bookmarksActiveMsg: 'సేవ్ చేసిన వార్తలను చూపిస్తున్నాము.',
    allNewsMsg: 'తిరిగి పూర్తి వార్తలకు వచ్చారు.',
    savedBookmarksBanner: '🔖 సేవ్ చేసిన బుక్‌మార్క్స్',
    categoryBanner: '📂 కేటగిరీ: ',

    // Empty Feed
    allCaughtUpTitle: 'మీరు అన్ని తాజా వార్తలను చదివేశారు! 🎉',
    allCaughtUpSubtitle: "You're all caught up! No unread news left.",
    noNewsTitle: 'వార్తలు అందుబాటులో లేవు',
    noNewsSubtitle: 'No stories found in this section.',
    viewAllBtn: 'అన్ని వార్తలను చూడండి (View All)',

    // Card Toolbar & Alerts
    savedToBookmarks: 'బుక్‌మార్క్‌లలో సేవ్ చేయబడింది',
    removedFromBookmarks: 'బుక్‌మార్క్‌ల నుండి తొలగించబడింది',
    sharePrompt: 'పూర్తి వివరాలు NTODAY NEWS లో చదవండి:',

    // Comments Modal
    commentsTitle: 'వ్యాఖ్యలు (Comments)',
    commentsEmptyTitle: 'మొదటి వ్యాఖ్యను మీరే రాయండి!',
    commentsEmptySubtitle: 'Be the first to share your thoughts.',
    commentsPlaceholder: 'మీ అభిప్రాయాన్ని రాయండి...',

    // Categories Modal
    categoriesTitle: 'కేటగిరీలు ఎంచుకోండి (Categories)',
    allCategories: 'అన్నీ (All Stories)',

    // Explore View
    searchPlaceholder: 'Search all news, including older stories',
    listenToNewsTitle: 'Listen to the news',
    listenToNewsSubtitle: 'Hands-free, one story after another',
    topNowTitle: 'Top now',
    topNowSubtitle: 'What readers are opening right now',
    playlistsTitle: 'Playlists',
    playlistsSubtitle: 'Plays on, one story after another',

    // Live View
    liveBannerText: 'NTODAY LIVE 24x7 NEWS TICKER',
    liveRadioTitle: 'NTODAY Live Audio Stream',
    liveRadioSubtitle: 'Listen live directly from Hyderabad studio',
    liveBreakingUpdates: 'తాజా లైవ్ అప్‌డేట్స్ (Breaking Updates)',
    minutesAgo: 'నిమిషాల క్రితం',

    // Videos View
    videosBadge: 'NTODAY VIDEO',
    videoStarted: 'ప్లేయర్ ప్రారంభమైంది.',

    // Feedback Modal
    feedbackTitle: 'Submit Feedback',
    feedbackSubtitle: 'Have a suggestion or found a bug? Let us know!',
    feedbackCategoryLabel: 'Select Category (విభాగం ఎంచుకోండి)',
    feedbackRatingLabel: 'How would you rate NTODAY App?',
    feedbackMessageLabel: 'Your Feedback (మీ అభిప్రాయం)',
    feedbackPlaceholder: 'Type your message here... మీ అభిప్రాయాన్ని లేదా సమస్యను ఇక్కడ టైప్ చేయండి...',
    feedbackContactLabel: 'Contact Info (Optional - Email or Phone)',
    feedbackSendBtn: 'Send Feedback (అభిప్రాయం పంపండి)',
    feedbackSuccessTitle: 'ధన్యవాదాలు (Thank you!)',
    feedbackSuccessMsg: 'మీ అభిప్రాయం NTODAY డెస్క్‌కు విజయవంతంగా చేరింది. మీ సూచనలు మాకు ఎంతో విలువైనవి!',

    // Account View
    accountTitle: 'Account',
    userRole: 'NTODAY Reader',
    mySubmissions: 'నా సమర్పణలు',
    savedSection: 'SAVED',
    savedBookmarks: 'Bookmarks',
    savedShorts: 'Saved Shorts',
    preferencesSection: 'PREFERENCES',
    feedAndContent: 'Feed & Content',
    readingFontSize: 'Reading',
    moreSection: 'MORE',
    privacySafety: 'Privacy & Safety',
    followUs: 'Follow us',
    myFeedback: 'My Feedback',
    accountSettings: 'Account',
  },
  en: {
    // Header
    latest: 'Latest',
    unread: 'Unread',
    feedback: 'Feedback',
    bookmarksActive: 'Bookmarks Mode',
    bookmarksActiveMsg: 'Showing your saved stories.',
    allNewsMsg: 'Returned to the complete news feed.',
    savedBookmarksBanner: '🔖 Saved Bookmarks',
    categoryBanner: '📂 Category: ',

    // Empty Feed
    allCaughtUpTitle: "You're all caught up! 🎉",
    allCaughtUpSubtitle: 'No unread news remaining.',
    noNewsTitle: 'No Stories Available',
    noNewsSubtitle: 'Check back later for fresh updates.',
    viewAllBtn: 'View All Stories',

    // Card Toolbar & Alerts
    savedToBookmarks: 'Saved to Bookmarks',
    removedFromBookmarks: 'Removed from Bookmarks',
    sharePrompt: 'Read the full story on NTODAY NEWS:',

    // Comments Modal
    commentsTitle: 'Comments',
    commentsEmptyTitle: 'Be the first to comment!',
    commentsEmptySubtitle: 'Share your thoughts with the community.',
    commentsPlaceholder: 'Write your comment...',

    // Categories Modal
    categoriesTitle: 'Select Categories',
    allCategories: 'All Stories',

    // Explore View
    searchPlaceholder: 'Search all news, including older stories',
    listenToNewsTitle: 'Listen to the news',
    listenToNewsSubtitle: 'Hands-free, one story after another',
    topNowTitle: 'Top now',
    topNowSubtitle: 'What readers are opening right now',
    playlistsTitle: 'Playlists',
    playlistsSubtitle: 'Plays on, one story after another',

    // Live View
    liveBannerText: 'NTODAY LIVE 24x7 NEWS TICKER',
    liveRadioTitle: 'NTODAY Live Audio Stream',
    liveRadioSubtitle: 'Listen live directly from Hyderabad studio',
    liveBreakingUpdates: 'Live Breaking Updates',
    minutesAgo: 'min ago',

    // Videos View
    videosBadge: 'NTODAY VIDEO',
    videoStarted: 'Video player initialized.',

    // Feedback Modal
    feedbackTitle: 'Submit Feedback',
    feedbackSubtitle: 'Have a suggestion or found a bug? Let us know!',
    feedbackCategoryLabel: 'Select Category',
    feedbackRatingLabel: 'How would you rate NTODAY App?',
    feedbackMessageLabel: 'Your Feedback',
    feedbackPlaceholder: 'Type your message or bug report here...',
    feedbackContactLabel: 'Contact Info (Optional - Email or Phone)',
    feedbackSendBtn: 'Send Feedback',
    feedbackSuccessTitle: 'Thank You!',
    feedbackSuccessMsg: 'Your feedback has reached the NTODAY editorial desk.',

    // Account View
    accountTitle: 'Account',
    userRole: 'NTODAY Reader',
    mySubmissions: 'My Submissions',
    savedSection: 'SAVED',
    savedBookmarks: 'Bookmarks',
    savedShorts: 'Saved Shorts',
    preferencesSection: 'PREFERENCES',
    feedAndContent: 'Feed & Content',
    readingFontSize: 'Reading',
    moreSection: 'MORE',
    privacySafety: 'Privacy & Safety',
    followUs: 'Follow us',
    myFeedback: 'My Feedback',
    accountSettings: 'Account',
  },
} as const;
