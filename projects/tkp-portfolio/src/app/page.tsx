'use client'

const games = [
  {
    title: 'Tycoon Game v2',
    type: 'Tycoon',
    description: 'An immersive factory simulation with complex production chains, global trading, and competitive leaderboards.',
    tech: ['Roblox', 'Luau', 'DataStore2'],
    metrics: {
      players: '450K+',
      visits: '2.1M',
      rating: '4.8/5',
    },
    status: 'live',
    image: '/placeholder-tycoon.jpg',
  },
  {
    title: 'Racing Game',
    type: 'Racing',
    description: 'High-speed racing with custom physics, 20+ tracks, vehicle customization, and weekly tournaments.',
    tech: ['Roblox', 'Luau', 'Physics Engine'],
    metrics: {
      players: '320K+',
      visits: '1.5M',
      rating: '4.7/5',
    },
    status: 'live',
    image: '/placeholder-racing.jpg',
  },
  {
    title: 'Obby Game',
    type: 'Obby',
    description: 'Challenging obstacle courses with 100+ levels, seasonal events, speedrun modes, and custom obby tools.',
    tech: ['Roblox', 'Luau', 'Custom Physics'],
    metrics: {
      players: '280K+',
      visits: '980K',
      rating: '4.6/5',
    },
    status: 'live',
    image: '/placeholder-obby.jpg',
  },
]

const statusColors = {
  live: 'bg-green-100 text-green-800',
  development: 'bg-yellow-100 text-yellow-800',
  coming_soon: 'bg-blue-100 text-blue-800',
}

export default function PortfolioPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900">
              Our Portfolio
            </h1>
            <p className="text-xl text-slate-600">
              Games that have engaged millions of players worldwide.
              Each project is crafted with attention to detail and player experience.
            </p>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section id="games" className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12">
            {games.map((game) => (
              <article
                key={game.title}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Gameplay screenshot</span>
                  </div>
                  <div className="p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                        {game.type}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[game.status as keyof typeof statusColors]}`}>
                        {game.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="mb-3 text-2xl font-bold text-slate-900">{game.title}</h2>
                    <p className="mb-6 text-slate-600">{game.description}</p>

                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{game.metrics.players}</div>
                        <div className="text-sm text-slate-500">Players</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{game.metrics.visits}</div>
                        <div className="text-sm text-slate-500">Visits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-primary-600">{game.metrics.rating}</div>
                        <div className="text-sm text-slate-500">Rating</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {game.tech.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href="/contact"
                      className="inline-block rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      Inquire About Similar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
              Why Work With Us?
            </h2>
            <p className="mb-12 text-lg text-slate-600">
              TKP Dev Studio specializes in creating engaging Roblox experiences. With over 1 million
              combined players across our games, we have a proven track record of delivering
              high-quality, engaging gameplay.
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 text-4xl font-bold text-primary-600">1M+</div>
                <div className="text-sm text-slate-600">Active Players</div>
              </div>
              <div className="text-center">
                <div className="mb-4 text-4xl font-bold text-primary-600">50+</div>
                <div className="text-sm text-slate-600">Games Launched</div>
              </div>
              <div className="text-center">
                <div className="mb-4 text-4xl font-bold text-primary-600">98%</div>
                <div className="text-sm text-slate-600">Player Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Want to Be Our Next Success Story?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-100">
            Let&apos;s discuss how we can build a game that engages your target audience.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-primary-600 shadow-lg transition-colors hover:bg-primary-50"
          >
            Start a Conversation
          </a>
        </div>
      </section>
    </div>
  )
}
