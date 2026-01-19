import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FolderOpen,
  Images,
  Handshake,
  MessageSquareQuote,
  Mail,
  TrendingUp,
  Eye,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data - replace with your backend data
const stats = [
  { title: 'Total Events', value: '24', change: '+3 this month', icon: Calendar, color: 'from-primary to-rose-gold' },
  { title: 'Albums', value: '156', change: '+12 this month', icon: FolderOpen, color: 'from-emerald to-accent' },
  { title: 'Gallery Images', value: '1,240', change: '+89 this month', icon: Images, color: 'from-blue-500 to-purple-500' },
  { title: 'Inquiries', value: '45', change: '+8 new', icon: Mail, color: 'from-orange-500 to-rose-500' },
];

const quickActions = [
  { title: 'Add New Event', href: '/admin/events/new', icon: Calendar },
  { title: 'Create Album', href: '/admin/albums/new', icon: FolderOpen },
  { title: 'Upload Images', href: '/admin/gallery/upload', icon: Images },
  { title: 'Add Collaboration', href: '/admin/collaborations/new', icon: Handshake },
];

const recentInquiries = [
  { id: 1, name: 'Rahul Sharma', event: 'Wedding', date: '2 hours ago', status: 'new' },
  { id: 2, name: 'Priya Patel', event: 'Birthday Party', date: '5 hours ago', status: 'new' },
  { id: 3, name: 'Amit Kumar', event: 'Corporate Event', date: '1 day ago', status: 'contacted' },
  { id: 4, name: 'Sneha Gupta', event: 'Engagement', date: '2 days ago', status: 'contacted' },
];

const recentActivity = [
  { id: 1, action: 'New album created', target: 'Sharma Wedding 2024', time: '30 min ago' },
  { id: 2, action: '15 images uploaded', target: 'Corporate Event Gallery', time: '2 hours ago' },
  { id: 3, action: 'Testimonial added', target: 'Patel Family', time: '1 day ago' },
  { id: 4, action: 'Event updated', target: 'Birthday Package', time: '2 days ago' },
];

export default function AdminDashboard() {
  return (
    <AdminLayout title="Dashboard" subtitle="Welcome back! Here's what's happening with your events.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-emerald mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <action.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Inquiries</CardTitle>
              <Link to="/admin/inquiries">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {inquiry.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{inquiry.name}</p>
                        <p className="text-xs text-muted-foreground">{inquiry.event}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        inquiry.status === 'new' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {inquiry.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{inquiry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < recentActivity.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.target}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Site Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Site Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">10</p>
                <p className="text-xs text-muted-foreground">Event Types</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">156</p>
                <p className="text-xs text-muted-foreground">Albums</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">8</p>
                <p className="text-xs text-muted-foreground">Partners</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">24</p>
                <p className="text-xs text-muted-foreground">Testimonials</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-primary">6</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
}
