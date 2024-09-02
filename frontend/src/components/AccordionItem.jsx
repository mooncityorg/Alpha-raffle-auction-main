import React from 'react'
import { Disclosure, Transition } from '@headlessui/react'
import './AccordionItem.css'/* 
import plusCircle from '../images/plus-circle.svg' */

const AccordionItem = ({ question, answer }) => {

  return (

    <div role="listitem" className="feed-post faq-feed-post w-dyn-item  mb-2 px-4">
      <div className="feed-post-wrapper">
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="feed-plus w-full">
                <div className="feed-post--header text-left text-lg font-bold tracking-wider pb-1 flex items-center justify-between">
                  <h2 className="feed-post--title">{question}</h2>
                  <div className={`arrow-container w-3 ${open ? 'transform -rotate-90' : 'transform rotate-90'
                    }`}>
                    {/* eslint-disable-next-line */}
                    <img src="/assets/Arrow_white.svg" alt="Arrow"></img>
                  </div>
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition duration-600 linear"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-600 linear"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="">

                  <div className="feed-post--content-wrapper">
                    <div className="feed-post--content-line font-thin"></div>
                    <div className="feed-rte w-richtext">
                      <p>
                        {answer}
                      </p>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}

        </Disclosure>
      </div>
    </div>
  )
}

export default AccordionItem