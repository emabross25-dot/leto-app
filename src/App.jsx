import React, { useState, useEffect, useCallback } from 'react'
import {
  Home, Gamepad2, Dices, Ticket, Trophy, User,
  Coins, Flame, Star, Zap, Gift, Copy, Check,
  ChevronRight, Lock, Unlock, Crown, Gem, Target,
  TrendingUp, Users, AlertCircle, Sparkles, Diamond,
  Timer, Calendar, Award, Shield, Sword, Rocket
} from 'lucide-react'
import { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, increment, serverTimestamp } from './firebase.js'

/* ===== CONSTANTS ===== */
const VIP_LEVELS = [
  { name: 'Newcomer', minXp: 0, color: '#9ca3af' },
  { name: 'Explorer', minXp: 100, color: '#22c55e' },
  { name: 'Adventurer', minXp: 300, color: '#3b82f6' },
  { name: 'Challenger', minXp: 600, color: '#06b6d4' },
  { name: 'Contender', minXp: 1000, color: '#8b5cf6' },
  { name: 'Warrior', minXp: 1500, color: '#a855f7' },
  { name: 'Elite', minXp: 2200, color: '#d946ef' },
  { name: 'Master', minXp: 3000, color: '#ec4899' },
  { name: 'Grandmaster', minXp: 4000, color: '#f43f5e' },
  { name: 'Legend', minXp: 5500, color: '#f97316' },
  { name: 'Mythic', minXp: 7500, color: '#eab308' },
  { name: 'Immortal', minXp: 10000, color: '#f59e0b' },
  { name: 'Titan', minXp: 14000, color: '#fbbf24' },
  { name: 'Godlike', minXp: 20000, color: '#ffd700' },
]

const DAILY_REWARDS = [50, 75, 100, 150, 200, 300, 500]

const GAMES = [
  {
    id: 'dice',
    name: 'Dice',
    desc: 'Roll the dice and test your luck. Predict high or low!',
    icon: Dices,
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.08))',
  },
  {
    id: 'limbo',
    name: 'Limbo',
    desc: 'How low can you go? Set your target multiplier!',
    icon: Rocket,
    color: '#00d4ff',
    bgGradient: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(59,130,246,0.08))',
  },
  {
    id: 'mines',
    name: 'Mines',
    desc: 'Avoid the mines and multiply your LETO coins!',
    icon: Target,
    color: '#22c55e',
    bgGradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(234,179,8,0.08))',
  },
]

const RAFFLES = [
  {
    id: 'daily',
    name: 'Daily Drop',
    prize: 5000,
    type: 'daily',
    badge: 'daily',
    desc: 'Every day at midnight UTC',
  },
  {
    id: 'weekly',
    name: 'Weekly Draw',
    prize: 15000,
    type: 'weekly',
    badge: 'weekly',
    desc: 'Every Sunday at midnight UTC',
  },
  {
    id: 'monthly',
    name: 'Monthly Mega',
    prize: 50000,
    type: 'monthly',
    badge: 'monthly',
    desc: '15th of every month',
  },
]

const COMING_SOON = [
  { name: 'Daily $25', desc: 'Win real cash every day', icon: Gem },
  { name: 'Cash Drop $500', desc: 'Massive weekly cash prize', icon: Coins },
  { name: 'iPhone 17 Pro', desc: 'The ultimate tech giveaway', icon: Sparkles },
]

/* ===== HELPERS ===== */
function getVipLevel(xp) {
  let level = VIP_LEVELS[0]
  for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= VIP_LEVELS[i].minXp) {
      level = VIP_LEVELS[i]
      break
    }
  }
  const levelIndex = VIP_LEVELS.indexOf(level)
  const nextLevel = VIP_LEVELS[levelIndex + 1]
  const progress = nextLevel
    ? Math.min(100, Math.round(((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100))
    : 100
  return { ...level, index: levelIndex + 1, progress, nextLevel }
}

function getMultiavatarUrl(seed) {
  return `https://api.multiavatar.com/${encodeURIComponent(seed)}.svg`
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function getDayName(offset = 0) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return days[d.getDay()]
}

/* ===== TOAST COMPONENT ===== */
function Toast({ message, type, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 2500)
      return () => clearTimeout(t)
    }
  }, [visible, onClose])

  if (!visible) return null
  return (
    <div className={`toast ${visible ? 'show' : ''} toast-${type}`}>
      {type === 'success' ? <Check size={18} color="#22c55e" /> : <AlertCircle size={18} color="#ef4444" />}
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
    </div>
  )
}

/* ===== HOME TAB ===== */
function HomeTab({ userData, userId, onClaimDaily, claimedToday, streak, toast }) {
  const vip = getVipLevel(userData?.xp || 0)
  const avatarUrl = getMultiavatarUrl(userData?.avatarSeed || userId || 'default')

  return (
    <div>
      <div className="home-header">
        <div className="logo-text gradient-text">LETOX</div>
        <div className="user-bar">
          <img src={avatarUrl} alt="avatar" className="avatar-img" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{userData?.name || 'Player'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              <span style={{ color: vip.color, fontWeight: 700 }}>VIP {vip.index}</span> — {vip.name}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <Coins size={18} color="#ffd700" style={{ marginBottom: 6 }} />
          <div className="stat-value">{formatNumber(userData?.balance || 0)}</div>
          <div className="stat-label">LETO</div>
        </div>
        <div className="stat-box">
          <Star size={18} color="#a855f7" style={{ marginBottom: 6 }} />
          <div className="stat-value">{formatNumber(userData?.xp || 0)}</div>
          <div className="stat-label">XP</div>
        </div>
        <div className="stat-box">
          <Ticket size={18} color="#00d4ff" style={{ marginBottom: 6 }} />
          <div className="stat-value">{userData?.tickets || 0}</div>
          <div className="stat-label">Tickets</div>
        </div>
      </div>

      <div className="glass-card checkin-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Gift size={20} color="#ffd700" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>DAILY CHECK-IN</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Streak: <span style={{ color: '#ffd700', fontWeight: 700 }}>{streak} days</span> — Keep it going!
        </div>
        <div className="checkin-days">
          {DAILY_REWARDS.map((reward, i) => {
            const dayClaimed = (userData?.dailyStreak || 0) > i
            const isToday = i === (userData?.dailyStreak || 0) % 7
            return (
              <div key={i} className={`day-pill ${dayClaimed ? 'claimed' : ''} ${isToday && !claimedToday ? 'today' : ''}`}>
                <div className="day-num">Day {i + 1}</div>
                <div className="day-reward">+{reward}</div>
              </div>
            )
          })}
        </div>
        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          onClick={onClaimDaily}
          disabled={claimedToday}
        >
          {claimedToday ? 'Claimed Today' : 'Claim Daily Reward'}
        </button>
      </div>

      <div className="section-title">Quick Play</div>
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        {GAMES.slice(0, 2).map(game => (
          <div
            key={game.id}
            className="game-card"
            style={{ marginBottom: 12, background: game.bgGradient }}
          >
            <div className="game-icon-wrap" style={{ background: `${game.color}20` }}>
              <game.icon size={28} color={game.color} />
            </div>
            <div className="game-title">{game.name}</div>
            <div className="game-desc">{game.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===== GAMES TAB ===== */
function GamesTab() {
  return (
    <div style={{ paddingTop: 24 }}>
      <div className="home-header" style={{ paddingBottom: 8 }}>
        <div className="logo-text gradient-text-purple">GAMES</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          Choose your game and start winning LETO coins
        </div>
      </div>

      <div className="games-grid">
        {GAMES.map(game => (
          <div
            key={game.id}
            className="game-card"
            style={{ background: game.bgGradient }}
          >
            <div className="game-icon-wrap" style={{ background: `${game.color}20` }}>
              <game.icon size={28} color={game.color} />
            </div>
            <div className="game-title">{game.name}</div>
            <div className="game-desc">{game.desc}</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, fontSize: 11, padding: '10px' }}>
                Play Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 8 }}>More Coming Soon</div>
      <div className="glass-card" style={{ margin: '0 20px 20px', padding: 20, textAlign: 'center' }}>
        <Sparkles size={32} color="var(--text-muted)" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          New games are on the way. Stay tuned for exciting updates!
        </div>
      </div>
    </div>
  )
}

/* ===== RAFFLES TAB ===== */
function RafflesTab({ userData, userId, toast }) {
  const buyTicket = async (raffleId, cost = 1) => {
    if (!userId) return
    const tickets = userData?.tickets || 0
    if (tickets < cost) {
      toast('Not enough tickets!', 'error')
      return
    }
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { tickets: increment(-cost) })
      toast(`Ticket purchased for ${raffleId}!`, 'success')
    } catch (e) {
      toast('Error buying ticket', 'error')
    }
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <div className="home-header" style={{ paddingBottom: 8 }}>
        <div className="logo-text gradient-text">RAFFLES</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          Buy tickets and win massive LETO prizes
        </div>
      </div>

      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ticket size={22} color="#00d4ff" />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your Tickets</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#00d4ff' }}>
              {userData?.tickets || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">Active Raffles</div>
      {RAFFLES.map(raffle => (
        <div key={raffle.id} className={`glass-card raffle-card ${raffle.badge === 'monthly' ? 'gold' : ''}`}>
          <div className={`raffle-badge ${raffle.badge}`}>
            {raffle.badge === 'daily' && <Timer size={12} />}
            {raffle.badge === 'weekly' && <Calendar size={12} />}
            {raffle.badge === 'monthly' && <Crown size={12} />}
            {raffle.type}
          </div>
          <div className="raffle-prize">{formatNumber(raffle.prize)} LETO</div>
          <div className="raffle-date">{raffle.name} — {raffle.desc}</div>
          <button className="ticket-btn" onClick={() => buyTicket(raffle.id)}>
            Buy Ticket (1 Ticket)
          </button>
        </div>
      ))}

      <div className="section-title" style={{ marginTop: 8 }}>Coming Soon</div>
      {COMING_SOON.map((item, i) => (
        <div key={i} className="glass-card coming-soon-card">
          <div className="coming-soon-badge">Coming Soon</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <item.icon size={22} color="var(--text-muted)" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ===== LEADERBOARD TAB ===== */
function LeaderboardTab({ leaders, loading }) {
  return (
    <div style={{ paddingTop: 24 }}>
      <div className="home-header" style={{ paddingBottom: 8 }}>
        <div className="logo-text gradient-text">LEADERBOARD</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          Top players ranked by LETO balance
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="shimmer" style={{ height: 60, borderRadius: 12, margin: '0 20px 10px' }} />
          <div className="shimmer" style={{ height: 60, borderRadius: 12, margin: '0 20px 10px' }} />
          <div className="shimmer" style={{ height: 60, borderRadius: 12, margin: '0 20px 10px' }} />
        </div>
      ) : leaders.length === 0 ? (
        <div className="empty-state">
          <Trophy size={40} color="var(--text-muted)" />
          <div style={{ marginTop: 12, fontSize: 14 }}>No players yet. Be the first!</div>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaders.map((player, i) => {
            const vip = getVipLevel(player.xp || 0)
            const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''
            const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)'
            return (
              <div key={player.id || i} className={`leader-row ${rankClass}`}>
                <div className="leader-rank" style={{ color: rankColor }}>
                  {i + 1}
                </div>
                <img
                  src={getMultiavatarUrl(player.avatarSeed || player.id || 'default')}
                  alt=""
                  className="leader-avatar"
                />
                <div className="leader-info">
                  <div className="leader-name">{player.name || 'Anonymous'}</div>
                  <div className="leader-level">VIP {vip.index} {vip.name}</div>
                </div>
                <div className="leader-coins">{formatNumber(player.balance || 0)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ===== PROFILE TAB ===== */
function ProfileTab({ userData, userId, onAvatarChange, toast }) {
  const vip = getVipLevel(userData?.xp || 0)
  const avatarUrl = getMultiavatarUrl(userData?.avatarSeed || userId || 'default')
  const [copied, setCopied] = useState(false)

  const avatars = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    seed: `vip${i + 1}_${userId || 'default'}`,
    unlockLevel: i + 1,
  }))

  const handleCopy = () => {
    const link = `https://t.me/letox_bot?start=${userId || 'ref'}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast('Referral link copied!', 'success')
    })
  }

  // Safe fallback for all userData properties
  const safeName = userData?.name || 'Player'
  const safeBalance = userData?.balance || 0
  const safeXp = userData?.xp || 0
  const safeTickets = userData?.tickets || 0
  const safeStreak = userData?.streak || 0
  const safeReferrals = userData?.referrals || 0

  return (
    <div style={{ paddingTop: 24, paddingBottom: 100 }}>
      <div className="profile-header">
        <img src={avatarUrl} alt="avatar" className="profile-avatar" />
        <div className="profile-name">{safeName}</div>
        <div className="profile-id">ID: {userId || '...'}</div>
        <div className="vip-badge">
          <Crown size={14} />
          VIP {vip.index} — {vip.name}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-box">
          <Coins size={18} color="#ffd700" />
          <div className="stat-value">{formatNumber(safeBalance)}</div>
          <div className="stat-label">Balance</div>
        </div>
        <div className="stat-box">
          <Flame size={18} color="#f97316" />
          <div className="stat-value">{safeStreak}</div>
          <div className="stat-label">Streak</div>
        </div>
        <div className="stat-box">
          <Users size={18} color="#3b82f6" />
          <div className="stat-value">{safeReferrals}</div>
          <div className="stat-label">Refs</div>
        </div>
      </div>

      <div className="glass-card xp-section">
        <div className="xp-header">
          <span className="xp-label">XP Progress</span>
          <span className="xp-value">{formatNumber(safeXp)} / {vip.nextLevel ? formatNumber(vip.nextLevel.minXp) : 'MAX'}</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${vip.progress}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
          {vip.nextLevel
            ? `${vip.progress}% to VIP ${vip.index + 1} ${vip.nextLevel.name}`
            : 'Maximum level reached!'}
        </div>
      </div>

      <div className="section-title">Avatars</div>
      <div style={{ padding: '0 20px', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        Unlock new avatars by leveling up your VIP status
      </div>
      <div className="avatar-grid">
        {avatars.map(av => {
          const unlocked = vip.index >= av.unlockLevel
          const selected = userData?.avatarSeed === av.seed
          return (
            <div
              key={av.id}
              className={`avatar-option ${unlocked ? 'unlocked' : ''} ${selected ? 'selected' : ''}`}
              onClick={() => unlocked && onAvatarChange(av.seed)}
            >
              <img src={getMultiavatarUrl(av.seed)} alt="" />
              {!unlocked && (
                <div className="avatar-lock">
                  <span><Lock size={14} style={{ display: 'block', margin: '0 auto 2px' }} /> Lv.{av.unlockLevel}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="section-title">Referral</div>
      <div className="glass-card referral-card">
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Invite friends and earn <strong style={{ color: '#ffd700' }}>100 LETO</strong> for each friend who joins!
        </div>
        <div className="referral-link-box">
          <input
            className="referral-link-input"
            readOnly
            value={`https://t.me/letox_bot?start=${userId || 'ref'}`}
          />
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      <div className="section-title">Stats</div>
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        {[
          { label: 'Total XP Earned', value: formatNumber(safeXp), icon: Star },
          { label: 'Current Streak', value: `${safeStreak} days`, icon: Flame },
          { label: 'Tickets Owned', value: safeTickets, icon: Ticket },
          { label: 'Friends Referred', value: safeReferrals, icon: Users },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              padding: '14px 18px',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={18} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===== MAIN APP ===== */
export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [userData, setUserData] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claimedToday, setClaimedToday] = useState(false)
  const [leaders, setLeaders] = useState([])
  const [leadersLoading, setLeadersLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  // Initialize user from Telegram WebApp or fallback
  useEffect(() => {
    let tgUser = null
    let tgId = null

    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      tgUser = tg.initDataUnsafe?.user
      tgId = tgUser?.id?.toString()
    }

    const finalId = tgId || `demo_${Math.random().toString(36).slice(2, 10)}`
    const finalName = tgUser?.first_name
      ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
      : 'Player'

    setUserId(finalId)

    // Load or create user in Firestore
    const loadUser = async () => {
      try {
        const userRef = doc(db, 'users', finalId)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          const data = snap.data()
          setUserData(data)
          // Check if claimed today
          const today = getTodayKey()
          setClaimedToday(data.lastDailyClaim === today)
        } else {
          const newUser = {
            name: finalName,
            balance: 100,
            xp: 0,
            tickets: 0,
            streak: 0,
            dailyStreak: 0,
            lastDailyClaim: '',
            avatarSeed: `vip1_${finalId}`,
            referrals: 0,
            referredBy: '',
            createdAt: serverTimestamp(),
          }
          await setDoc(userRef, newUser)
          setUserData(newUser)
        }
      } catch (e) {
        console.error('Error loading user:', e)
        // Fallback data
        setUserData({
          name: finalName,
          balance: 100,
          xp: 0,
          tickets: 0,
          streak: 0,
          dailyStreak: 0,
          lastDailyClaim: '',
          avatarSeed: `vip1_${finalId}`,
          referrals: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Load leaderboard
  useEffect(() => {
    const loadLeaders = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('balance', 'desc'), limit(50))
        const snap = await getDocs(q)
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setLeaders(list)
      } catch (e) {
        console.error('Error loading leaderboard:', e)
        setLeaders([])
      } finally {
        setLeadersLoading(false)
      }
    }
    loadLeaders()
  }, [activeTab])

  // Daily claim handler
  const handleClaimDaily = async () => {
    if (!userId || claimedToday || !userData) return
    const today = getTodayKey()
    const dayIndex = (userData.dailyStreak || 0) % 7
    const reward = DAILY_REWARDS[dayIndex]

    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        balance: increment(reward),
        xp: increment(10),
        dailyStreak: increment(1),
        streak: increment(1),
        lastDailyClaim: today,
      })
      setUserData(prev => ({
        ...prev,
        balance: (prev?.balance || 0) + reward,
        xp: (prev?.xp || 0) + 10,
        dailyStreak: (prev?.dailyStreak || 0) + 1,
        streak: (prev?.streak || 0) + 1,
        lastDailyClaim: today,
      }))
      setClaimedToday(true)
      showToast(`+${reward} LETO claimed!`, 'success')
    } catch (e) {
      showToast('Claim failed. Try again.', 'error')
    }
  }

  // Avatar change handler
  const handleAvatarChange = async (seed) => {
    if (!userId) return
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, { avatarSeed: seed })
      setUserData(prev => ({ ...prev, avatarSeed: seed }))
      showToast('Avatar updated!', 'success')
    } catch (e) {
      showToast('Error updating avatar', 'error')
    }
  }

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'raffles', label: 'Raffles', icon: Ticket },
    { id: 'leaderboard', label: 'Top', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="logo-text gradient-text" style={{ fontSize: 36, marginBottom: 20 }}>LETOX</div>
          <div className="shimmer" style={{ width: 200, height: 4, borderRadius: 2, margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Toast {...toast} onClose={hideToast} />

      <div className="content-area">
        {activeTab === 'home' && (
          <HomeTab
            userData={userData}
            userId={userId}
            onClaimDaily={handleClaimDaily}
            claimedToday={claimedToday}
            streak={userData?.streak || 0}
            toast={showToast}
          />
        )}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'raffles' && (
          <RafflesTab userData={userData} userId={userId} toast={showToast} />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab leaders={leaders} loading={leadersLoading} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            userData={userData}
            userId={userId}
            onAvatarChange={handleAvatarChange}
            toast={showToast}
          />
        )}
      </div>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
