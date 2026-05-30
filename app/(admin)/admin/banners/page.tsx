"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Image as ImageIcon, 
  Pencil, 
  Trash2, 
  ExternalLink,
  Calendar,
  Layers,
  Megaphone,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const banners = [
  { id: 1, title: 'Summer Sourdough Fest', position: 'Hero', dates: '12 May – 30 May 2026', image: '🌾', status: 'Active' },
  { id: 2, title: 'Free Delivery above ₹499', position: 'Announcement', dates: 'Permanent', image: '🚚', status: 'Active' },
  { id: 3, title: 'New Arrival: Mango Cakes', position: 'Featured', dates: '10 May – 25 May 2026', image: '🥭', status: 'Active' },
  { id: 4, title: 'Old Winter Offer', position: 'Hero', dates: '01 Jan – 15 Jan 2026', image: '❄️', status: 'Inactive' },
];

export default function BannersPage() {
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementHighlight, setAnnouncementHighlight] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const res = await fetch('/api/admin/announcement');
        if (res.ok) {
          const data = await res.json();
          setAnnouncementText(data.text || '');
          setAnnouncementHighlight(data.highlightText || '');
          setAnnouncementLink(data.linkUrl || '');
        }
      } catch (err) {
        console.error("Failed to load announcement:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncement();
  }, []);

  const handleUpdateAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error("Announcement text cannot be empty");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: announcementText,
          highlightText: announcementHighlight,
          linkUrl: announcementLink,
        }),
      });

      if (res.ok) {
        toast.success("Announcement bar updated live!");
      } else {
        toast.error("Failed to update announcement bar");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Banners & Content</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage your website's visual content and promotions</p>
        </div>
        <Button className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white rounded-[4px] uppercase text-xs font-black tracking-widest px-6 h-10 gap-2">
          <Plus size={18} />
          Add Banner
        </Button>
      </div>

      {/* Banner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden flex flex-col">
            <div className="h-40 bg-[#f0f2e8] flex items-center justify-center text-5xl relative">
              {banner.image}
              <div className="absolute top-4 left-4">
                <Badge className={cn(
                  "rounded-full border-none px-3 py-0.5 text-[9px] font-black uppercase tracking-widest",
                  banner.position === 'Hero' ? "bg-[#3d5a2e] text-white" : 
                  banner.position === 'Announcement' ? "bg-[#c8872a] text-white" : "bg-[#185FA5] text-white"
                )}>
                  {banner.position}
                </Badge>
              </div>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#1a2c1a] uppercase tracking-tight">{banner.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={12} className="text-[#8a8a7a]" />
                    <span className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-wider">{banner.dates}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">
                    {banner.status}
                  </span>
                  <Switch checked={banner.status === 'Active'} readOnly />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f0f2e8]">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a] hover:bg-[#f0f2e8] gap-1.5">
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#A32D2D] hover:bg-[#FCEBEB] gap-1.5">
                    <Trash2 size={12} /> Delete
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#3d5a2e] hover:bg-[#EAF3DE] gap-1.5">
                  <ExternalLink size={12} /> View
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Announcement Bar Editor */}
      <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-[#1a2c1a] text-white space-y-6 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3d5a2e] flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Announcement Bar</h3>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Displayed at the very top of all pages</p>
            </div>
          </div>
          <Button 
            onClick={handleUpdateAnnouncement} 
            disabled={updating || loading}
            className="bg-[#c8872a] hover:bg-[#e8a845] text-white rounded-[4px] uppercase text-[10px] font-black tracking-widest px-6 h-9 flex items-center gap-2"
          >
            {updating && <Loader2 size={12} className="animate-spin" />}
            <span>Update Live</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 size={16} className="animate-spin text-[#c8872a]" />
            <span className="text-xs uppercase font-bold text-white/50 tracking-wider">Loading settings...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Input 
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value.slice(0, 100))}
                className="bg-white/5 border-white/10 text-white h-12 focus-visible:ring-[#c8872a] pr-20"
                maxLength={100}
                placeholder="Get 10% OFF on your first order! Use code: FRESHBAKE"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {announcementText.length} / 100
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50">Highlight Text</label>
                <Input 
                  value={announcementHighlight} 
                  onChange={(e) => setAnnouncementHighlight(e.target.value)}
                  className="bg-white/5 border-white/10 text-[#c8872a] font-black" 
                  placeholder="FRESHBAKE"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50">Link URL</label>
                <Input 
                  value={announcementLink} 
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  className="bg-white/5 border-white/10 text-white" 
                  placeholder="/shop"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
