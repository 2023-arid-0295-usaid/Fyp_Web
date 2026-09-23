"use client";

// Drop-in browser replacement for react-native-vector-icons/MaterialCommunityIcons.
// Renders `path` (from @mdi/js) as an inline SVG at the requested pixel size.
// Usage in the clone mirrors the RN app: <Icon name="account-outline" size={22} color="#1E64D3" />

import * as mdi from "@mdi/js";
import { useMemo } from "react";

const NAME_MAP = {
  "account-outline": mdi.mdiAccountOutline,
  "account-group-outline": mdi.mdiAccountGroupOutline,
  "account-group": mdi.mdiAccountGroup,
  "account-check": mdi.mdiAccountCheck,
  "account-cancel": mdi.mdiAccountCancel,
  "account-clock": mdi.mdiAccountClock,
  "account": mdi.mdiAccount,
  domain: mdi.mdiDomain,
  "office-building-marker-outline": mdi.mdiOfficeBuildingMarkerOutline,
  "shield-check-outline": mdi.mdiShieldCheckOutline,
  "shield-check": mdi.mdiShieldCheck,
  "shield-alert": mdi.mdiShieldAlert,
  "shield-account-outline": mdi.mdiShieldAccountOutline,
  "email-outline": mdi.mdiEmailOutline,
  "card-account-details-outline": mdi.mdiCardAccountDetailsOutline,
  "card-bulleted-outline": mdi.mdiCardBulletedOutline,
  "lock-outline": mdi.mdiLockOutline,
  eye: mdi.mdiEye,
  "eye-off": mdi.mdiEyeOff,
  "eye-outline": mdi.mdiEyeOutline,
  "eye-off-outline": mdi.mdiEyeOffOutline,
  "checkbox-marked": mdi.mdiCheckboxMarked,
  "checkbox-blank-outline": mdi.mdiCheckboxBlankOutline,
  "chevron-left": mdi.mdiChevronLeft,
  "chevron-right": mdi.mdiChevronRight,
  "chevron-down": mdi.mdiChevronDown,
  "arrow-left": mdi.mdiArrowLeft,
  "arrow-right": mdi.mdiArrowRight,
  "magnify": mdi.mdiMagnify,
  "format-list-bulleted": mdi.mdiFormatListBulleted,
  "map-marker": mdi.mdiMapMarker,
  "map-marker-outline": mdi.mdiMapMarkerOutline,
  "map-marker-radius-outline": mdi.mdiMapMarkerRadiusOutline,
  "map-marker-check": mdi.mdiMapMarkerCheck,
  "map-marker-check-outline": mdi.mdiMapMarkerCheckOutline,
  "map-search-outline": mdi.mdiMapSearchOutline,
  "crosshairs-gps": mdi.mdiCrosshairsGps,
  "calendar": mdi.mdiCalendar,
  "calendar-month-outline": mdi.mdiCalendarMonthOutline,
  "calendar-clock": mdi.mdiCalendarClock,
  "calendar-range": mdi.mdiCalendarRange,
  "clock-outline": mdi.mdiClockOutline,
  "clock-time-four-outline": mdi.mdiClockTimeFourOutline,
  "clock-alert-outline": mdi.mdiClockAlertOutline,
  star: mdi.mdiStar,
  "star-outline": mdi.mdiStarOutline,
  "phone": mdi.mdiPhone,
  "phone-outline": mdi.mdiPhoneOutline,
  "home-outline": mdi.mdiHomeOutline,
  "pencil-outline": mdi.mdiPencilOutline,
  logout: mdi.mdiLogout,
  "bag-personal-outline": mdi.mdiBagPersonalOutline,
  "briefcase-outline": mdi.mdiBriefcaseOutline,
  "briefcase-search-outline": mdi.mdiBriefcaseSearchOutline,
  "file-document-outline": mdi.mdiFileDocumentOutline,
  "account-search-outline": mdi.mdiAccountSearchOutline,
  "account-alert-outline": mdi.mdiAccountAlertOutline,
  "folder-open-outline": mdi.mdiFolderOpenOutline,
  trash: mdi.mdiTrashCan,
  "trash-can-outline": mdi.mdiTrashCanOutline,
  "comment-question-outline": mdi.mdiCommentQuestionOutline,
  "message-outline": mdi.mdiMessageOutline,
  "message-draw": mdi.mdiMessageDraw,
  "check-decagram": mdi.mdiCheckDecagram,
  "check-circle-outline": mdi.mdiCheckCircleOutline,
  "check": mdi.mdiCheck,
  "ribbon": mdi.mdiRibbon,
  "send-outline": mdi.mdiSendOutline,
  "format-quote-open": mdi.mdiFormatQuoteOpen,
  "format-quote-close": mdi.mdiFormatQuoteClose,
  "alert-circle-outline": mdi.mdiAlertCircleOutline,
  "plus": mdi.mdiPlus,
  "plus-circle-outline": mdi.mdiPlusCircleOutline,
  "close": mdi.mdiClose,
  "close-circle-outline": mdi.mdiCloseCircleOutline,
  "content-save-check": mdi.mdiContentSaveCheck,
  "camera-outline": mdi.mdiCameraOutline,
  "broom": mdi.mdiBroom,
  "car": mdi.mdiCar,
  "chef-hat": mdi.mdiChefHat,
  "gender-male": mdi.mdiGenderMale,
  "gender-female": mdi.mdiGenderFemale,
  "currency-usd": mdi.mdiCurrencyUsd,
  "text-account": mdi.mdiTextBoxOutline,
  "text-box-outline": mdi.mdiTextBoxOutline,
  "alert": mdi.mdiAlert,
  "alert-octagon": mdi.mdiAlertOctagon,
  "badge-account-outline": mdi.mdiBadgeAccountOutline,
  "bell-outline": mdi.mdiBellOutline,
  "square-edit-outline": mdi.mdiSquareEditOutline,
  "reorder-horizontal": mdi.mdiReorderHorizontal,
  "map-marker-check": mdi.mdiMapMarkerCheck,
  "webhook": mdi.mdiWebhook,
  "information-outline": mdi.mdiInformationOutline,
  "information": mdi.mdiInformation,
  "arrow-up": mdi.mdiArrowUp,
  "filter": mdi.mdiFilter,
};

export default function Icon({ name, size = 24, color = "#333", style, ...rest }) {
  const path = NAME_MAP[name];
  const fill = color;
  const dims = { width: size, height: size, viewBox: "0 0 24 24", fill };
  return (
    <svg
      {...dims}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
      {...rest}
    >
      {path ? <path d={path} /> : <path d={mdi.mdiHelpCircle} />}
    </svg>
  );
}
