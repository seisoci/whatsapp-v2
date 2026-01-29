export const routes = {
  eCommerce: {
    dashboard: "#",
    products: "#",
    createProduct: "#",
    productDetails: (slug: string) => "#",
    ediProduct: (slug: string) => "#",
    categories: "#",
    createCategory: "#",
    editCategory: (id: string) => "#",
    orders: "#",
    createOrder: "#",
    orderDetails: (id: string) => "#",
    editOrder: (id: string) => "#",
    reviews: "#",
    shop: "#",
    cart: "#",
    checkout: "#",
    trackingId: (id: string) => "#",
  },


  chat: "/chat",
  quickReplies: "/quick-replies",




  support: {
    dashboard: "/support",
    inbox: "/support/inbox",
    supportCategory: (category: string) => `/support/inbox/${category}`,
    messageDetails: (id: string) => `/support/inbox/${id}`,
    snippets: "/support/snippets",
    createSnippet: "/support/snippets/create",
    viewSnippet: (id: string) => `/support/snippets/${id}`,
    editSnippet: (id: string) => `/support/snippets/${id}/edit`,
    templates: "/support/templates",
    createTemplate: "/support/templates/create",
    viewTemplate: (id: string) => `/support/templates/${id}`,
    editTemplate: (id: string) => `/support/templates/${id}/edit`,
  },
















  rolesPermissions: "/roles-permissions",
  roles: "/roles",
  permissions: "/permissions",
  phoneNumbers: "/phone-numbers",
  contacts: "/contacts",
  apiManagement: "/api-management",
  messageQueues: "/message-queues",

  users: "/users",



  multiStep: "/multi-step",
  multiStep2: "/multi-step-2",

  emailTemplates: "/email-templates",
  profile: "/profile",
  welcome: "/welcome",
  comingSoon: "/coming-soon",
  accessDenied: "/access-denied",
  notFound: "/not-found",
  maintenance: "/maintenance",
  blank: "/blank",
  auth: {
    signUp1: "/auth/sign-up-1",
    signUp2: "/auth/sign-up-2",
    signUp3: "/auth/sign-up-3",
    signUp4: "/auth/sign-up-4",
    signUp5: "/auth/sign-up-5",
    signIn1: "/auth/sign-in-1",
    signIn2: "/auth/sign-in-2",
    signIn3: "/auth/sign-in-3",
    signIn4: "/auth/sign-in-4",
    signIn5: "/auth/sign-in-5",
    forgotPassword1: "/auth/forgot-password-1",
    forgotPassword2: "/auth/forgot-password-2",
    forgotPassword3: "/auth/forgot-password-3",
    forgotPassword4: "/auth/forgot-password-4",
    forgotPassword5: "/auth/forgot-password-5",
    otp1: "/auth/otp-1",
    otp2: "/auth/otp-2",
    otp3: "/auth/otp-3",
    otp4: "/auth/otp-4",
    otp5: "/auth/otp-5",
  },
  signIn: "/sign-in",



  templates: {
    dashboard: "/templates",
    create: "/templates/create",
    edit: (id: string) => `/templates/${id}/edit`,
  },
};
