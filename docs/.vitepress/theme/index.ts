import DefaultTheme from 'vitepress/theme';
import mixpanel from 'mixpanel-browser';
import 'virtual:group-icons.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'

export default {
  ...DefaultTheme,
  enhanceApp({ app, router }) {
    enhanceAppWithTabs(app);
    if (typeof window !== 'undefined') {
      console.info('mixpanel.init');
      mixpanel.init("fc5e794d2cfef6c0fd69f67eaae370d8", {
        api_host: 'https://reviews-catalog.kottster.app',
        debug: false,
        track_pageview: true,
        persistence: 'localStorage',
        
        cookie_domain: '.kottster.app',
        cross_subdomain_cookie: true,
        ignore_dnt: true,
      });
    }
  }
};