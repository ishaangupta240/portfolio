import React from 'react'
import WindowWrapper from '#hoc/WindowWrapper'
import WindowControls from '#components/WindowControls'
import { blogPosts } from '#constants'

const Safari = () => {
  return (
    <>
      <div id="window-header">
        <div className="safari-toolbar">
          <div className="safari-toolbar-left">
            <WindowControls target="safari"/>
            <img
              src="/icons/Pull%20Down%20Button%20Light.svg"
              alt="Options"
              className="toolbar-icon toolbar-pull"
            />
            
            <img
              src="/icons/Segmented%20Control%20Light.svg"
              alt="View controls"
              className="toolbar-icon toolbar-segment"
            />
          </div>

          <img
            src="/icons/Search%20Bar%20Light.svg"
            alt="Address bar"
            className="toolbar-search"
          />

          <div className="safari-toolbar-right">
            <img
              src="/icons/Button%20Group%20Light.svg"
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