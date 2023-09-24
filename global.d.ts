enum LayoutType {
  MIX = 'mix',
  TOP = 'top',
  SIDE = 'side',
}

declare const CONFIG: {

  appName: string;
  helpLink: string;
  enablePWA: boolean;

  theme: {
    accentColor: string;
    sidebarLayout: LayoutType;
    showBreadcrumb: boolean;
  };

  metaTags: {
    title: string;
    description: string;
    imageURL: string;
  };
};
