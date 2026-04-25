interface FlexaUnsubscribeConfig {
  plugin_url: string;
  admin_url: string;
  rest_url: string;
  rest_nonce: string;
  rest_base: string;

  timezone_string: string;
  date_format: string;
  time_format: string;

  admin_post_nonces: {
    export_unsubscribes: string;
    export_blocked: string;
    export_resubscribed: string;
  };
}

interface Window {
  flexaUnsubscribe?: FlexaUnsubscribeConfig;
}
