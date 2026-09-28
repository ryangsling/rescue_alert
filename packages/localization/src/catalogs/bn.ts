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

  auth_full_name_label: "পুরো নাম",
  auth_email_label: "ইমেইল",
  auth_phone_label: "ফোন নম্বর",
  auth_city_label: "শহর",
  auth_area_label: "এলাকা",
  auth_password_label: "পাসওয়ার্ড",
  auth_confirm_password_label: "পাসওয়ার্ড নিশ্চিত করুন",
  auth_current_password_label: "বর্তমান পাসওয়ার্ড",
  auth_terms_label: "আমি ব্যবহারের শর্তাবলী মেনে নিচ্ছি",
  auth_privacy_label: "আমি গোপনীয়তা নীতি মেনে নিচ্ছি",
  auth_location_policy_label: "আমি অবস্থান নীতি মেনে নিচ্ছি",
  auth_community_rules_label: "আমি কমিউনিটি নিয়মাবলী মেনে নিচ্ছি",
  auth_register_heading: "আপনার অ্যাকাউন্ট তৈরি করুন",
  auth_register_submit: "অ্যাকাউন্ট তৈরি করুন",
  auth_register_success_heading: "আপনার ইমেইল দেখুন",
  auth_register_success_message:
    "আমরা {email} ঠিকানায় একটি যাচাইকরণ লিংক পাঠিয়েছি। আপনার ইমেইল যাচাই করুন, তারপর সাইন ইন করুন।",
  auth_already_have_account: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
  auth_sign_in_link: "সাইন ইন করুন",
  auth_sign_in_heading: "সাইন ইন করুন",
  auth_forgot_password_link: "পাসওয়ার্ড ভুলে গেছেন?",
  auth_no_account: "অ্যাকাউন্ট নেই?",
  auth_register_link: "একটি তৈরি করুন",
  auth_sign_in_error: "ভুল ইমেইল বা পাসওয়ার্ড",
  auth_forgot_password_heading: "আপনার পাসওয়ার্ড রিসেট করুন",
  auth_forgot_password_instructions:
    "আপনার ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট করার লিংক পাঠাবো।",
  auth_forgot_password_submit: "রিসেট লিংক পাঠান",
  auth_forgot_password_success:
    "{email} ঠিকানায় অ্যাকাউন্ট থাকলে, একটি রিসেট লিংক পাঠানো হয়েছে।",
  auth_reset_password_heading: "একটি নতুন পাসওয়ার্ড বেছে নিন",
  auth_reset_password_submit: "পাসওয়ার্ড আপডেট করুন",
  auth_reset_password_success: "আপনার পাসওয়ার্ড আপডেট হয়েছে।",

  onboarding_capabilities_heading: "আপনি কীভাবে সাহায্য করতে চান?",
  onboarding_capabilities_instructions: "ঐচ্ছিক। যা প্রযোজ্য তা নির্বাচন করুন।",
  onboarding_animal_types_heading: "পছন্দের প্রাণীর ধরন",
  onboarding_alert_radius_heading: "সতর্কতার পরিসীমা",
  onboarding_alert_radius_unit_km: "{km} কিমি",
  onboarding_continue: "চালিয়ে যান",
  onboarding_finish: "সম্পন্ন করুন",
  capability_on_site_rescue: "স্থান-ভিত্তিক উদ্ধার",
  capability_transport: "পরিবহন",
  capability_veterinary_professional: "পশুচিকিৎসা পেশাদার",
  capability_veterinary_assistant: "পশুচিকিৎসা সহকারী",
  capability_temporary_foster: "সাময়িক ফস্টার",
  capability_shelter_coordination: "আশ্রয় সমন্বয়",
  capability_adoption_support: "দত্তক সহায়তা",
  capability_case_coordination: "কেস সমন্বয়",
  capability_financial_support_interest: "আর্থিক সহায়তা",

  account_settings_heading: "অ্যাকাউন্ট",
  account_sign_out: "সাইন আউট",
  account_sign_out_all_devices: "সব ডিভাইস থেকে সাইন আউট করুন",
  account_delete_heading: "অ্যাকাউন্ট মুছুন",
  account_delete_warning:
    "এটি পূর্বাবস্থায় ফেরানো যাবে না। নিশ্চিত করতে আপনার পাসওয়ার্ড দিন।",
  account_delete_confirm: "আমার অ্যাকাউন্ট মুছে ফেলুন",
  account_delete_wrong_password: "পাসওয়ার্ডটি ভুল",

  report_step_x_of_7: "ধাপ {step}/৭",
  report_incident_type_heading: "কী ঘটেছে?",
  report_urgency_heading: "এটি কতটা জরুরি?",
  incident_injured_animal: "আহত প্রাণী",
  incident_road_accident: "সড়ক দুর্ঘটনা",
  incident_critically_ill_animal: "মুমূর্ষু প্রাণী",
  incident_trapped_animal: "আটকে পড়া প্রাণী",
  incident_abandoned_animal: "পরিত্যক্ত প্রাণী",
  incident_abuse_or_cruelty_suspected: "নির্যাতনের সন্দেহ",
  incident_mother_with_babies: "বাচ্চাসহ মা",
  incident_orphaned_babies: "অনাথ বাচ্চা",
  incident_traffic_risk_animal: "যান চলাচলে ঝুঁকিপূর্ণ প্রাণী",
  incident_temporary_foster_needed: "সাময়িক ফস্টার প্রয়োজন",
  incident_shelter_needed: "আশ্রয় প্রয়োজন",
  incident_transport_needed: "পরিবহন প্রয়োজন",
  incident_veterinary_treatment_needed: "পশুচিকিৎসা প্রয়োজন",
  incident_lost_animal_found: "হারানো প্রাণী পাওয়া গেছে",
  incident_adoption_needed: "দত্তক প্রয়োজন",
  incident_other_animal_welfare_concern: "অন্যান্য প্রাণী-কল্যাণ সংক্রান্ত",
  urgency_critical: "সংকটাপন্ন",
  urgency_urgent: "জরুরি",
  urgency_support_needed: "সহায়তা প্রয়োজন",
  urgency_adoption_community: "দত্তক বা কমিউনিটি",
  report_animal_type_heading: "প্রাণীর ধরন",
  report_photo_heading: "একটি ছবি যোগ করুন",
  report_photo_instructions:
    "অন্তত একটি ছবি সাড়াদানকারীদের পরিস্থিতি বুঝতে সাহায্য করে।",
  report_photo_add: "ছবি যোগ করুন",
  report_photo_remove: "সরান",
  report_photo_processing: "ছবি প্রক্রিয়া করা হচ্ছে...",
  report_condition_heading: "আপনি যা দেখছেন তা বর্ণনা করুন",
  report_condition_placeholder: "দৃশ্যমান আঘাত, আচরণ, পারিপার্শ্বিকতা...",
  report_location_heading: "অবস্থান নিশ্চিত করুন",
  report_location_use_gps: "আমার বর্তমান অবস্থান ব্যবহার করুন",
  report_location_manual_instructions:
    "অথবা ম্যানুয়ালি অবস্থান দিন। মানচিত্রে পিন সামঞ্জস্য করার সুবিধা শীঘ্রই আসছে।",
  report_latitude_label: "অক্ষাংশ",
  report_longitude_label: "দ্রাঘিমাংশ",
  report_landmark_heading: "একটি ল্যান্ডমার্ক এবং বিস্তারিত যোগ করুন",
  report_still_here_label: "আমি এখনও এই অবস্থানে আছি",
  report_review_heading: "নিরাপত্তা ও গোপনীয়তা পর্যালোচনা করুন",
  report_preview_heading: "প্রিভিউ ও জমা দিন",
  report_submit: "রিপোর্ট জমা দিন",
  report_success_heading: "রিপোর্ট জমা হয়েছে",
  report_success_message:
    "আপনার রিপোর্ট প্রকাশিত হয়েছে। রেফারেন্স {reference}।",
  report_duplicate_warning_heading: "কাছাকাছি একই ধরনের রিপোর্ট",
  report_duplicate_warning_message:
    "এই প্রাণীর জন্য ইতিমধ্যে একটি রিপোর্ট থাকতে পারে। নতুন রিপোর্ট জমা দেওয়ার আগে পর্যালোচনা করুন।",
  report_back: "পেছনে",
};
