export default defineNuxtConfig({
  devtools:{enabled:false},
  typescript:{strict:true},

  runtimeConfig:{
    public:{
      siteHosts:[
        'kalambrestudio.com',
        'www.kalambrestudio.com',
        'kalambrestudio.es',
        'www.kalambrestudio.es'
      ],
      defaultSiteUrl:'https://kalambrestudio.com',
      primarySiteUrl:'https://kalambrestudio.com'
    }
  },

  modules:[
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],

  nitro:{preset:'vercel'},

  site:{
    url:'https://kalambrestudio.com',
    name:'KalambreStudio'
  },

  sitemap:{
    urls:[
      '/',
      '/arte',
      '/diseno',
      '/marca',
      '/fotografia',
      '/video',
      '/marketing',
      '/publicidad',
      '/branding',
      '/creatividad',
      '/contenido',
      '/redes',
      '/digital',
      '/estudio',
      '/portfolio',
      '/proyectos',
      '/equipo',
      '/contacto'
    ]
  },

  robots:{
    allow:['/'],
    disallow:[],
    sitemap:['https://kalambrestudio.com/sitemap.xml']
  },

  app:{
    head:{
      title:'KalambreStudio — Portfolio',
      meta:[
        {name:'viewport',content:'width=device-width, initial-scale=1'},
        {name:'theme-color',content:'#000000'},
        {name:'author',content:'AnderNikolay'}
      ],
      link:[
        {rel:'icon',type:'image/x-icon',href:'/favicon.ico'}
      ]
    }
  }
})
