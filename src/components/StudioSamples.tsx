"use client"

import React from "react"
import { ScrollVelocity } from "./ui/scroll-velocity"

const images = [
  {
    title: "Sample 1",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample1.png",
  },
  {
    title: "Sample 2",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample2.png",
  },
  {
    title: "Sample 3",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample3.png",
  },
  {
    title: "Sample 4",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample4.png",
  },
  {
    title: "Sample 5",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample5.png",
  },
  {
    title: "Sample 6",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample6.png",
  },
  {
    title: "Sample 7",
    thumbnail: "https://auqwezpczravciclsemz.supabase.co/storage/v1/object/public/headshost/indexpage_img/sample7.png",
  },
]


export function StudioSamples() {
  const velocity = [0.8, -0.8]
  
  return (
    <div className="w-full overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Studio Quality Samples
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
        </div>
      </div>
      
      <div className="relative">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] -z-10"></div>
        
        {/* Side Masks for smooth fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none" />
        
        <div className="flex flex-col space-y-4 md:space-y-8 py-4">
          {velocity.map((v, index) => (
            <ScrollVelocity key={index} velocity={v} className="py-2">
              {images.map(({ title, thumbnail }, i) => (
                <div
                  key={`${title}-${i}`}
                  className="relative h-[10.5rem] w-[8.4rem] md:h-[14rem] md:w-[11.2rem] xl:h-[16.8rem] xl:w-[13.3rem] group mx-2"
                >
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  <img
                    src={thumbnail}
                    alt={title}
                    className="relative z-10 h-full w-full object-cover rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded">
                      {title}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollVelocity>
          ))}
        </div>
      </div>
    </div>
  )
}
