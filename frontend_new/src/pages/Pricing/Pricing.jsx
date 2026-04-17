import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Sparkles, TrendingUp, TrendingDown, Tag, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { getPricing, addPricing, deletePricing } from '../../api/pricing';

const PricingManagement = () => {
  const [pricingRules, setPricingRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newRule, setNewRule] = useState({ productId: '', basePrice: '', recommendedPrice: '' });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setIsLoading(true);
    try {
      const data = await getPricing();
      setPricingRules(data);
    } catch (error) {
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.productId || !newRule.basePrice || !newRule.recommendedPrice) {
      toast.error('Fill all fields'); return;
    }
    try {
      await addPricing(newRule);
      toast.success('Pricing rule added');
      setIsDialogOpen(false);
      fetchPricing();
    } catch (error) {
      toast.error('Error adding rule');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePricing(id);
      setPricingRules(pricingRules.filter(p => p.id !== id));
      toast.success('Rule deleted');
    } catch (error) {
      toast.error('Error deleting rule');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-indigo-500" /> AI Pricing Intelligence</h1>
          <p className="text-muted-foreground">Dynamic pricing and margin optimization</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Custom Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Pricing Rule</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Product ID</Label><Input onChange={(e) => setNewRule({...newRule, productId: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Base Price</Label><Input type="number" onChange={(e) => setNewRule({...newRule, basePrice: e.target.value})} /></div>
                <div className="space-y-2"><Label>AI Recommended</Label><Input type="number" onChange={(e) => setNewRule({...newRule, recommendedPrice: e.target.value})} /></div>
              </div>
              <Button className="w-full" onClick={handleAddRule}>Save Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Active Pricing Models</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Loading AI recommendations...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Recommended</TableHead>
                  <TableHead>Margin Impact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingRules.map((rule, i) => {
                  const diff = rule.recommendedPrice - rule.basePrice;
                  const isPositive = diff >= 0;
                  return (
                    <motion.tr key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                      <TableCell className="font-mono">{rule.productId}</TableCell>
                      <TableCell>₹{rule.basePrice}</TableCell>
                      <TableCell className="font-bold text-indigo-400">₹{rule.recommendedPrice}</TableCell>
                      <TableCell>
                        <Badge variant={isPositive ? 'default' : 'destructive'} className="flex w-fit gap-1">
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {isPositive ? '+' : ''}₹{diff.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="secondary">Apply Price</Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagement;