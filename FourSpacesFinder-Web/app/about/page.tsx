'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GlassButton } from '@/components/ui/GlassButton';
import { ArrowLeft } from 'lucide-react';

type Person = {
  name: string;
  imageSrc?: string;
};

const PEOPLE: Person[] = [
  { name: 'Magalona, Adriel', imageSrc: '/asset/img/Adriel.png' },
  { name: 'Puti, Vince', imageSrc: '/asset/img/Vince.jpg' },
  { name: 'Mac, Lozano' },
  { name: 'Monterey, Reine Arabelle', imageSrc: '/asset/img/Reine.jpg' },
  { name: 'Dotollo, Zyrah Mae', imageSrc: '/asset/img/Zyrah.JPG' },
  { name: 'Castillejo, Paul Daniel' },
];

function initialsFromName(name: string) {
  const parts = name
    .replace(',', ' ')
    .split(' ')
    .map(s => s.trim())
    .filter(Boolean);
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black p-4 md:p-8 font-sans">
      <div className="w-full max-w-[95%] mx-auto space-y-6">
        <GlassPanel>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <GlassButton onClick={() => router.push('/')} className="w-fit pl-3 pr-4">
              <ArrowLeft className="w-4 h-4" />
              Back
            </GlassButton>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Four Fundamental Spaces Finder</h1>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>
                  <span className="font-bold">Final Project in Linear Algebra</span>
                </p>
                <p>
                  <span className="font-semibold">Project Goal:</span> Build a program/application that accepts an 
                  <span className="font-mono mx-1">m-by-n</span> matrix (where <span className="font-mono">m, n ≤ 5</span>) 
                  and returns bases for its four fundamental subspaces.
                </p>
                <p>
                  We implemented additional features including LaTeX equation copying, 
                  geometric visualization of subspaces in 2D/3D planes, and detailed calculation steps 
                  showing the Row Reduced Echelon Form (RREF) process.
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PEOPLE.map((p) => (
            <GlassPanel key={p.name} className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/30 bg-white/30 dark:bg-white/10 dark:border-white/10 flex items-center justify-center">
                  {p.imageSrc ? (
                    <Image
                      src={p.imageSrc}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      priority={false}
                    />
                  ) : (
                    <div className="relative flex flex-col items-center justify-center leading-none w-full h-full">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {initialsFromName(p.name)}
                      </span>
                      <span className="mt-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                        Image
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</div>
                  <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contributor
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </main>
  );
}
