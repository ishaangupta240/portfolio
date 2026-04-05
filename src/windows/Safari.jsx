import React, { useEffect, useState } from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'
import { blogPosts } from '#constants'

const SAFARI_TOOLBAR_ASSETS = {
  light: {
    pull: '/icons/Pull%20Down%20Button%20Light.png',
    segment: '/icons/Segmented%20Control%20Light.png',
    search: '/icons/Search%20Bar%20Light.png',
    nav: '/icons/Button%20Group%20Light.png',
  },
  dark: {
    pull: '/icons/Pull%20Down%20Button.png',
    segment: '/icons/Segmented%20Control.png',
    search: '/icons/Search%20Bar.png',
    nav: '/icons/Button%20Group.png',
  },
}

const getThemeFromDocument = () => {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

const Safari = () => {
  const [theme, setTheme] = useState(getThemeFromDocument)
  const toolbarAssets = theme === 'dark' ? SAFARI_TOOLBAR_ASSETS.dark : SAFARI_TOOLBAR_ASSETS.light

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => {
      setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')
    }

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div className="window-header">
        <div className="safari-toolbar">
          <div className="safari-toolbar-left">
            <WindowControls target="safari"/>
            <img
              src={toolbarAssets.pull}
              alt="Options"
              className="toolbar-icon toolbar-pull"
            />
            
            <img
              src={toolbarAssets.segment}
              alt="View controls"
              className="toolbar-icon toolbar-segment"
            />
          </div>

          <img
            src={toolbarAssets.search}
            alt="Address bar"
            className="toolbar-search"
          />

          <div className="safari-toolbar-right">
            <img
              src={toolbarAssets.nav}
              alt="Navigation controls"
              className="toolbar-icon toolbar-nav"
            />
          </div>
        </div>
      </div>

      <div className="safari-content">

        <div className="blog">
        <h2>Latest Articles</h2>
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-post">
              <img src={post.image} alt={post.title} className="col-span-2" />
              <div className="content">
                <p>{post.date}</p>
                <h3>{post.title}</h3>
                <a href={post.link} target="_blank" rel="noreferrer">
                  Read article
                </a>
              </div>
            </article>
          ))}
        </div>
        </div>
      </div>
    </>
  )
}

const SafariWindow = WindowWrapper(Safari, 'safari')

export default SafariWindow