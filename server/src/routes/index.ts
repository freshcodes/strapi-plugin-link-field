const adminRoutes = [
  {
    method: 'GET',
    path: '/relations',
    handler: 'controller.getRelations',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/relations/:relationKey/options',
    handler: 'controller.getRelationOptions',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/generate-url',
    handler: 'controller.generateUrl',
    config: {
      policies: [],
    },
  },
]

const routes = {
  admin: {
    type: 'admin',
    routes: adminRoutes,
  },
}

export default routes
