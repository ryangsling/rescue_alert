import type { en } from "./en";

/**
 * বাংলা catalog. Draft translations - PRD requirement L10N-006
 * ("translations must be reviewed by native speakers familiar with
 * rescue terminology") has not been satisfied and cannot be from
 * this environment; flag this explicitly rather than presenting
 * these as reviewed. Interpolation placeholders ({minutes}, etc.)
 * are kept as literal tokens matching the English catalog.
 */
export const bn: Record<keyof typeof en, string> = {
  app_name: "রেসকিউ অ্যালার্ট",

  action_submit: "জমা দিন",
  action_cancel: "বাতিল করুন",
  action_retry: "আবার চেষ্টা করুন",
  action_save: "সংরক্ষণ করুন",
  action_close: "বন্ধ করুন",
  action_i_can_help: "আমি সাহায্য করতে পারি",
  action_report_animal: "একটি প্রাণী রিপোর্ট করুন",

  status_responder_en_route: "স্বেচ্ছাসেবক আসছেন",
  status_animal_located: "প্রাণীটি খুঁজে পাওয়া গেছে",
  status_resolved: "সমাধান হয়েছে",
  status_closed: "বন্ধ হয়েছে",

  content_last_seen_minutes: "প্রাণীটি {minutes} মিনিট আগে দেখা গেছে",
  content_location_approximate: "অবস্থান আনুমানিক",
  content_professional_help_recommended: "পেশাদার সাহায্য সুপারিশ করা হচ্ছে",
  content_could_not_send:
    "পাঠানো যায়নি। আপনার রিপোর্ট এই ডিভাইসে সংরক্ষিত আছে।",

  disclaimer_no_guaranteed_responder:
    "এই অ্যাপ কোনো সাড়াদানকারীর নিশ্চয়তা দেয় না।",
  disclaimer_urgency_not_diagnosis:
    "কমিউনিটি-রিপোর্ট করা জরুরি অবস্থা কোনো পশুচিকিৎসা নির্ণয় নয়।",
  disclaimer_volunteers_independent:
    "স্বেচ্ছাসেবকরা স্বাধীনভাবে কাজ করেন, যদি না তারা স্পষ্টভাবে কোনো যাচাইকৃত সংস্থার প্রতিনিধিত্ব করেন।",
  disclaimer_contact_authorities:
    "তাৎক্ষণিক মানব বিপদের ক্ষেত্রে, যথাযথ সরকারি কর্তৃপক্ষ বা চিকিৎসা সেবার সাথে যোগাযোগ করুন।",

  error_generic_heading: "কিছু একটা ভুল হয়েছে",
  error_generic_message: "আপনার তথ্য নিরাপদ আছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
  error_offline_heading: "আপনি অফলাইনে আছেন",
  error_offline_message: "আপনি অনলাইনে ফিরে এলে পরিবর্তনগুলো সিঙ্ক হবে।",

  form_required_field: "এই ঘরটি পূরণ করা আবশ্যক",
};
