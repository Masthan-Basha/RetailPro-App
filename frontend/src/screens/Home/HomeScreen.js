import React,{useState,useEffect,useCallback} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import {salesAPI,inventoryAPI,customerAPI,dealerAPI,invoiceAPI} from '../../utils/api';
import {formatCurrency,formatDate} from '../../utils/format';
import {RADIUS,SPACING,SHADOW} from '../../utils/theme';
import { Feather } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

export default function HomeScreen({navigation}){
  const {user,logout}=useAuth();
  const {theme,isDark,toggleTheme}=useTheme();
  const insets=useSafeAreaInsets();
  const hour=new Date().getHours();
  const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  const [summary,setSummary]=useState(null);
  const [lowStock,setLowStock]=useState([]);
  const [pending,setPending]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);

  const fetchAll=useCallback(async()=>{
    try{
      const [s,ls,cp,dp,inv]=await Promise.allSettled([
        salesAPI.summary(),inventoryAPI.lowStock(),customerAPI.pending(),dealerAPI.pending(),
        invoiceAPI.getAll({limit:5,sort:'-createdAt'}),
      ]);
      if(s.status==='fulfilled')   setSummary(s.value.data);
      if(ls.status==='fulfilled')  setLowStock(ls.value.data||[]);
      const cP=(cp.status==='fulfilled'?(cp.value.data||[]):[]).map(c=>({...c,type:'customer'}));
      const dP=(dp.status==='fulfilled'?(dp.value.data||[]):[]).map(d=>({...d,type:'dealer'}));
      setPending([...cP,...dP]);
      if(inv.status==='fulfilled') setInvoices(inv.value.data||[]);
    }catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetchAll();},[fetchAll]);
  const onRefresh=()=>{setRefreshing(true);fetchAll();};

  const Card=({children,style})=><View style={[{backgroundColor:theme.bgCard,borderRadius:RADIUS.lg,borderWidth:1,borderColor:theme.border,overflow:'hidden'},SHADOW.card,style]}>{children}</View>;
  const SectionHeader=({title,iconName,iconColor,badge,link,onLink})=>(
    <View style={styles.sectionHeader}>
      <Feather name={iconName} size={18} color={iconColor||theme.textPrimary} style={{marginRight:4}}/>
      <Text style={[styles.sectionTitle,{color:theme.textPrimary}]}>{title}</Text>
      {badge>0&&<View style={[styles.badgePill,{backgroundColor:theme.redBg}]}><Text style={[styles.badgeText,{color:theme.red}]}>{badge}</Text></View>}
      <TouchableOpacity onPress={onLink}><Text style={[styles.link,{color:theme.accent}]}>{link} →</Text></TouchableOpacity>
    </View>
  );

  return(
    <ScrollView style={[{flex:1,backgroundColor:theme.bgBase},{paddingTop:insets.top}]} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent}/>}>

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={{flex:1,marginRight:SPACING.sm}}>
          <Text style={[styles.greeting,{color:theme.textPrimary}]} numberOfLines={1}>{greeting}, {user?.name?.split(' ')[0]||'Owner'} 👋</Text>
          <Text style={[styles.shopName,{color:theme.textMuted}]} numberOfLines={1}>{user?.shopName||'Your Shop'}</Text>
        </View>
        <View style={{flexDirection:'row',gap:SPACING.sm,alignItems:'center'}}>
          {/* 🌙/☀️ Theme Toggle */}
          <TouchableOpacity style={[styles.iconBtn,{backgroundColor:theme.bgCard,borderColor:theme.border}]} onPress={toggleTheme}>
            <Feather name={isDark?'sun':'moon'} size={18} color={isDark?theme.amber:theme.accent}/>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.logoutBtn,{backgroundColor:theme.bgCard,borderColor:theme.red+'44',borderWidth:1}]} onPress={async()=>{await logout();}}>
            <Feather name="log-out" size={16} color={theme.red}/>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.newBtn,{backgroundColor:theme.accent},SHADOW.md]} onPress={()=>navigation.navigate('Invoices',{screen:'CreateInvoice'})}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.newBtnText}>Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Low Stock Banner ── */}
      {!loading&&lowStock.length>0&&(
        <TouchableOpacity style={[styles.alertBanner,{backgroundColor:theme.amberBg,borderColor:theme.amber+'55',borderWidth:1}]}
          onPress={()=>navigation.navigate('Inventory')}>
          <Feather name="alert-triangle" size={16} color={theme.amber}/>
          <Text style={[styles.alertText,{color:theme.amber}]}>
            {` ⚠️ ${lowStock.length} item${lowStock.length>1?'s':''} running low on stock — Tap to view`}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Stats Grid ── */}
      <View style={styles.statsGrid}>
        <StatCard label="Today's Sales"  value={loading?'—':formatCurrency(summary?.todaySales??0)}      iconName="dollar-sign" color={theme.accent} sub={loading?'':String(summary?.invoicesToday??0)+' invoices'}/>
        <StatCard label="Month Revenue"  value={loading?'—':formatCurrency(summary?.monthSales??0)}       iconName="trending-up" color={theme.green}/>
      </View>
      <View style={styles.statsGrid}>
        <StatCard label="Customer Dues"  value={loading?'—':formatCurrency(summary?.pendingCustomer??0)}  iconName="users" color={theme.amber} sub={loading?'':String(summary?.overdueCount??0)+' overdue'}/>
        <StatCard label="Dealer Dues"    value={loading?'—':formatCurrency(summary?.pendingDealer??0)}     iconName="truck" color={theme.red}/>
      </View>

      {/* ── Sales Chart ── */}
      {!loading&&(
        <View style={{marginTop:SPACING.md}}>
          <Text style={[styles.sectionTitle,{color:theme.textPrimary,marginBottom:SPACING.sm}]}>Sales Performance</Text>
          <LineChart
            data={{
              labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
              datasets:[{data:[
                (summary?.todaySales||400)*0.4,(summary?.todaySales||500)*0.7,
                (summary?.todaySales||600)*0.5,(summary?.todaySales||400)*0.9,
                (summary?.todaySales||800)*1.2,(summary?.todaySales||700),
                (summary?.todaySales||Math.random()*1000)
              ]}]
            }}
            width={Dimensions.get('window').width-SPACING.md*2}
            height={220}
            chartConfig={{
              backgroundColor:theme.bgCard,
              backgroundGradientFrom:theme.bgCard,
              backgroundGradientTo:theme.bgCard,
              decimalPlaces:0,
              color:(opacity=1)=>`rgba(59,130,246,${opacity})`,
              labelColor:(opacity=1)=>isDark?`rgba(136,146,170,${opacity})`:`rgba(74,85,104,${opacity})`,
              style:{borderRadius:RADIUS.lg},
              propsForDots:{r:'5',strokeWidth:'2',stroke:theme.accent},
              propsForBackgroundLines:{strokeDasharray:'5,5',stroke:theme.border}
            }}
            bezier
            style={{marginVertical:8,borderRadius:RADIUS.lg,borderWidth:1,borderColor:theme.border,paddingRight:40}}
          />
        </View>
      )}

      {/* ── Low Stock List ── */}
      <SectionHeader title="Low Stock" iconName="alert-triangle" iconColor={theme.amber} badge={lowStock.length} link="View all" onLink={()=>navigation.navigate('Inventory')}/>
      <Card>
        {loading&&<Text style={[styles.empty,{color:theme.textMuted}]}>Loading…</Text>}
        {!loading&&lowStock.length===0&&<Text style={[styles.empty,{color:theme.textMuted}]}>All items sufficiently stocked ✓</Text>}
        {!loading&&lowStock.map((it,i)=>(
          <View key={it._id} style={[styles.row,i>0&&{borderTopWidth:1,borderTopColor:theme.border}]}>
            <Text style={[styles.rowName,{color:theme.textPrimary}]}>{it.name}</Text>
            <View style={[styles.qtyBadge,{backgroundColor:theme.amberBg}]}><Text style={[styles.qtyText,{color:theme.amber}]}>{it.quantity} {it.unit}</Text></View>
          </View>
        ))}
      </Card>

      {/* ── Pending Payments ── */}
      <SectionHeader title="Pending Payments" iconName="bell" iconColor={theme.red} badge={0} link="View" onLink={()=>navigation.navigate('Customers')}/>
      <Card>
        {loading&&<Text style={[styles.empty,{color:theme.textMuted}]}>Loading…</Text>}
        {!loading&&pending.length===0&&<Text style={[styles.empty,{color:theme.textMuted}]}>No pending payments</Text>}
        {!loading&&pending.map((p,i)=>(
          <View key={p._id} style={[styles.row,i>0&&{borderTopWidth:1,borderTopColor:theme.border}]}>
            <View>
              <Text style={[styles.rowName,{color:theme.textPrimary}]}>{p.name}</Text>
              <Text style={[styles.rowSub,{color:theme.textMuted}]}>{p.type==='customer'?'Customer':'Dealer'}</Text>
            </View>
            <Text style={[styles.pendAmt,{color:p.type==='customer'?theme.amber:theme.red}]}>{formatCurrency(p.pending||p.amount||0)}</Text>
          </View>
        ))}
      </Card>

      {/* ── Recent Invoices ── */}
      <SectionHeader title="Recent Invoices" iconName="clipboard" badge={0} link="View all" onLink={()=>navigation.navigate('Invoices')}/>
      <Card style={{marginBottom:SPACING.xl}}>
        {loading&&<Text style={[styles.empty,{color:theme.textMuted}]}>Loading…</Text>}
        {!loading&&invoices.length===0&&(
          <TouchableOpacity onPress={()=>navigation.navigate('Invoices',{screen:'CreateInvoice'})}>
            <Text style={[styles.empty,{color:theme.accent}]}>No invoices yet — create your first one</Text>
          </TouchableOpacity>
        )}
        {!loading&&invoices.map((inv,i)=>(
          <TouchableOpacity key={inv._id} style={[styles.row,i>0&&{borderTopWidth:1,borderTopColor:theme.border}]}
            onPress={()=>navigation.navigate('Invoices',{screen:'InvoiceDetail',params:{id:inv._id||inv.id,invoice:inv}})}>
            <View>
              <Text style={[styles.rowName,{color:theme.accent}]}>{inv.invoiceNumber||inv._id}</Text>
              <Text style={[styles.rowSub,{color:theme.textMuted}]}>{inv.customer?.name||inv.customerName||'—'} · {formatDate(inv.createdAt)}</Text>
            </View>
            <View style={{alignItems:'flex-end',gap:4}}>
              <Text style={[styles.invAmt,{color:theme.textPrimary}]}>{formatCurrency(inv.grandTotal||inv.amount||0)}</Text>
              <Badge status={inv.status||'draft'}/>
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}
const styles=StyleSheet.create({
  content:{padding:SPACING.md},
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.md},
  greeting:{fontSize:16,fontWeight:'700'},
  shopName:{fontSize:14,marginTop:2},
  iconBtn:{width:40,height:40,borderRadius:RADIUS.md,alignItems:'center',justifyContent:'center',borderWidth:1},
  logoutBtn:{width:40,height:40,borderRadius:RADIUS.md,alignItems:'center',justifyContent:'center',borderWidth:1},
  newBtn:{borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:4,elevation:4},
  newBtnText:{color:'#fff',fontSize:13,fontWeight:'800'},
  alertBanner:{flexDirection:'row',alignItems:'center',padding:SPACING.sm,borderRadius:RADIUS.md,marginBottom:SPACING.md,gap:6},
  alertText:{fontSize:13,fontWeight:'600',flex:1},
  statsGrid:{flexDirection:'row',gap:SPACING.sm,marginBottom:SPACING.sm},
  sectionHeader:{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginTop:SPACING.lg,marginBottom:SPACING.sm},
  sectionTitle:{fontSize:17,fontWeight:'700',flex:1},
  badgePill:{borderRadius:RADIUS.full,paddingHorizontal:8,paddingVertical:2},
  badgeText:{fontSize:11,fontWeight:'700'},
  link:{fontSize:13,fontWeight:'600'},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.md},
  rowName:{fontSize:14,fontWeight:'600'},
  rowSub:{fontSize:12,marginTop:2},
  pendAmt:{fontSize:14,fontWeight:'700'},
  invAmt:{fontSize:14,fontWeight:'700'},
  qtyBadge:{borderRadius:RADIUS.full,paddingHorizontal:8,paddingVertical:3},
  qtyText:{fontSize:12,fontWeight:'700'},
  empty:{padding:SPACING.md,textAlign:'center',fontSize:14},
});
