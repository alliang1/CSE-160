// cuon-matrix.js (c) 2012 kanda and matsuda
class Vector3 {
    constructor(opt_src) {
        var v = new Float32Array(3);
        if (opt_src && typeof opt_src === 'object') { v[0]=opt_src[0]; v[1]=opt_src[1]; v[2]=opt_src[2]; }
        this.elements = v;
    }
    set(src) { var s=src.elements,d=this.elements; for(var i=0;i<3;i++) d[i]=s[i]; return this; }
    add(o) { this.elements[0]+=o.elements[0]; this.elements[1]+=o.elements[1]; this.elements[2]+=o.elements[2]; return this; }
    sub(o) { this.elements[0]-=o.elements[0]; this.elements[1]-=o.elements[1]; this.elements[2]-=o.elements[2]; return this; }
    div(s) { this.elements[0]/=s; this.elements[1]/=s; this.elements[2]/=s; return this; }
    mul(s) { this.elements[0]*=s; this.elements[1]*=s; this.elements[2]*=s; return this; }
    static dot(a,b) { return a.elements[0]*b.elements[0]+a.elements[1]*b.elements[1]+a.elements[2]*b.elements[2]; }
    static cross(a,b) { var ae=a.elements,be=b.elements; return new Vector3([ae[1]*be[2]-ae[2]*be[1], ae[2]*be[0]-ae[0]*be[2], ae[0]*be[1]-ae[1]*be[0]]); }
    magnitude() { var e=this.elements; return Math.sqrt(e[0]*e[0]+e[1]*e[1]+e[2]*e[2]); }
    normalize() { var m=this.magnitude(); this.elements[0]/=m; this.elements[1]/=m; this.elements[2]/=m; return this; }
}

class Vector4 {
    constructor(opt_src) {
        var v = new Float32Array(4);
        if (opt_src && typeof opt_src === 'object') { v[0]=opt_src[0]; v[1]=opt_src[1]; v[2]=opt_src[2]; v[3]=opt_src[3]; }
        this.elements = v;
    }
}

class Matrix4 {
    constructor(opt_src) {
        if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
            var s=opt_src.elements, d=new Float32Array(16);
            for(var i=0;i<16;i++) d[i]=s[i];
            this.elements=d;
        } else {
            this.elements=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        }
    }
    setIdentity() { var e=this.elements; e[0]=1;e[4]=0;e[8]=0;e[12]=0; e[1]=0;e[5]=1;e[9]=0;e[13]=0; e[2]=0;e[6]=0;e[10]=1;e[14]=0; e[3]=0;e[7]=0;e[11]=0;e[15]=1; return this; }
    set(src) { var s=src.elements,d=this.elements; for(var i=0;i<16;i++) d[i]=s[i]; return this; }
    multiply(other) {
        var e=this.elements,a=this.elements,b=other.elements;
        if(e===b){b=new Float32Array(16); for(var i=0;i<16;i++) b[i]=e[i];}
        for(var i=0;i<4;i++){var a0=a[i],a1=a[i+4],a2=a[i+8],a3=a[i+12]; e[i]=a0*b[0]+a1*b[1]+a2*b[2]+a3*b[3]; e[i+4]=a0*b[4]+a1*b[5]+a2*b[6]+a3*b[7]; e[i+8]=a0*b[8]+a1*b[9]+a2*b[10]+a3*b[11]; e[i+12]=a0*b[12]+a1*b[13]+a2*b[14]+a3*b[15];}
        return this;
    }
    concat(other) { return this.multiply(other); }
    multiplyVector3(pos) { var e=this.elements,p=pos.elements,v=new Vector3(),r=v.elements; r[0]=p[0]*e[0]+p[1]*e[4]+p[2]*e[8]+e[12]; r[1]=p[0]*e[1]+p[1]*e[5]+p[2]*e[9]+e[13]; r[2]=p[0]*e[2]+p[1]*e[6]+p[2]*e[10]+e[14]; return v; }
    multiplyVector4(pos) { var e=this.elements,p=pos.elements,v=new Vector4(),r=v.elements; r[0]=p[0]*e[0]+p[1]*e[4]+p[2]*e[8]+p[3]*e[12]; r[1]=p[0]*e[1]+p[1]*e[5]+p[2]*e[9]+p[3]*e[13]; r[2]=p[0]*e[2]+p[1]*e[6]+p[2]*e[10]+p[3]*e[14]; r[3]=p[0]*e[3]+p[1]*e[7]+p[2]*e[11]+p[3]*e[15]; return v; }
    transpose() { var e=this.elements,t; t=e[1];e[1]=e[4];e[4]=t; t=e[2];e[2]=e[8];e[8]=t; t=e[3];e[3]=e[12];e[12]=t; t=e[6];e[6]=e[9];e[9]=t; t=e[7];e[7]=e[13];e[13]=t; t=e[11];e[11]=e[14];e[14]=t; return this; }
    setInverseOf(other) {
        var s=other.elements,d=this.elements,inv=new Float32Array(16);
        inv[0]=s[5]*s[10]*s[15]-s[5]*s[11]*s[14]-s[9]*s[6]*s[15]+s[9]*s[7]*s[14]+s[13]*s[6]*s[11]-s[13]*s[7]*s[10];
        inv[4]=-s[4]*s[10]*s[15]+s[4]*s[11]*s[14]+s[8]*s[6]*s[15]-s[8]*s[7]*s[14]-s[12]*s[6]*s[11]+s[12]*s[7]*s[10];
        inv[8]=s[4]*s[9]*s[15]-s[4]*s[11]*s[13]-s[8]*s[5]*s[15]+s[8]*s[7]*s[13]+s[12]*s[5]*s[11]-s[12]*s[7]*s[9];
        inv[12]=-s[4]*s[9]*s[14]+s[4]*s[10]*s[13]+s[8]*s[5]*s[14]-s[8]*s[6]*s[13]-s[12]*s[5]*s[10]+s[12]*s[6]*s[9];
        inv[1]=-s[1]*s[10]*s[15]+s[1]*s[11]*s[14]+s[9]*s[2]*s[15]-s[9]*s[3]*s[14]-s[13]*s[2]*s[11]+s[13]*s[3]*s[10];
        inv[5]=s[0]*s[10]*s[15]-s[0]*s[11]*s[14]-s[8]*s[2]*s[15]+s[8]*s[3]*s[14]+s[12]*s[2]*s[11]-s[12]*s[3]*s[10];
        inv[9]=-s[0]*s[9]*s[15]+s[0]*s[11]*s[13]+s[8]*s[1]*s[15]-s[8]*s[3]*s[13]-s[12]*s[1]*s[11]+s[12]*s[3]*s[9];
        inv[13]=s[0]*s[9]*s[14]-s[0]*s[10]*s[13]-s[8]*s[1]*s[14]+s[8]*s[2]*s[13]+s[12]*s[1]*s[10]-s[12]*s[2]*s[9];
        inv[2]=s[1]*s[6]*s[15]-s[1]*s[7]*s[14]-s[5]*s[2]*s[15]+s[5]*s[3]*s[14]+s[13]*s[2]*s[7]-s[13]*s[3]*s[6];
        inv[6]=-s[0]*s[6]*s[15]+s[0]*s[7]*s[14]+s[4]*s[2]*s[15]-s[4]*s[3]*s[14]-s[12]*s[2]*s[7]+s[12]*s[3]*s[6];
        inv[10]=s[0]*s[5]*s[15]-s[0]*s[7]*s[13]-s[4]*s[1]*s[15]+s[4]*s[3]*s[13]+s[12]*s[1]*s[7]-s[12]*s[3]*s[5];
        inv[14]=-s[0]*s[5]*s[14]+s[0]*s[6]*s[13]+s[4]*s[1]*s[14]-s[4]*s[2]*s[13]-s[12]*s[1]*s[6]+s[12]*s[2]*s[5];
        inv[3]=-s[1]*s[6]*s[11]+s[1]*s[7]*s[10]+s[5]*s[2]*s[11]-s[5]*s[3]*s[10]-s[9]*s[2]*s[7]+s[9]*s[3]*s[6];
        inv[7]=s[0]*s[6]*s[11]-s[0]*s[7]*s[10]-s[4]*s[2]*s[11]+s[4]*s[3]*s[10]+s[8]*s[2]*s[7]-s[8]*s[3]*s[6];
        inv[11]=-s[0]*s[5]*s[11]+s[0]*s[7]*s[9]+s[4]*s[1]*s[11]-s[4]*s[3]*s[9]-s[8]*s[1]*s[7]+s[8]*s[3]*s[5];
        inv[15]=s[0]*s[5]*s[10]-s[0]*s[6]*s[9]-s[4]*s[1]*s[10]+s[4]*s[2]*s[9]+s[8]*s[1]*s[6]-s[8]*s[2]*s[5];
        var det=s[0]*inv[0]+s[1]*inv[4]+s[2]*inv[8]+s[3]*inv[12];
        if(det===0) return this;
        det=1/det;
        for(var i=0;i<16;i++) d[i]=inv[i]*det;
        return this;
    }
    invert() { return this.setInverseOf(this); }
    setOrtho(l,r,b,t,n,f) { var e=this.elements,rw=1/(r-l),rh=1/(t-b),rd=1/(f-n); e[0]=2*rw;e[1]=0;e[2]=0;e[3]=0; e[4]=0;e[5]=2*rh;e[6]=0;e[7]=0; e[8]=0;e[9]=0;e[10]=-2*rd;e[11]=0; e[12]=-(r+l)*rw;e[13]=-(t+b)*rh;e[14]=-(f+n)*rd;e[15]=1; return this; }
    ortho(l,r,b,t,n,f) { return this.concat(new Matrix4().setOrtho(l,r,b,t,n,f)); }
    setFrustum(l,r,b,t,n,f) { var e=this.elements,rw=1/(r-l),rh=1/(t-b),rd=1/(f-n); e[0]=2*n*rw;e[1]=0;e[2]=0;e[3]=0; e[4]=0;e[5]=2*n*rh;e[6]=0;e[7]=0; e[8]=(r+l)*rw;e[9]=(t+b)*rh;e[10]=-(f+n)*rd;e[11]=-1; e[12]=0;e[13]=0;e[14]=-2*n*f*rd;e[15]=0; return this; }
    frustum(l,r,b,t,n,f) { return this.concat(new Matrix4().setFrustum(l,r,b,t,n,f)); }
    setPerspective(fovy,aspect,near,far) {
        var e,rd,s,ct;
        if(near===far||aspect===0) throw 'null frustum';
        if(near<=0) throw 'near<=0'; if(far<=0) throw 'far<=0';
        fovy=Math.PI*fovy/180/2; s=Math.sin(fovy); if(s===0) throw 'null frustum';
        rd=1/(far-near); ct=Math.cos(fovy)/s; e=this.elements;
        e[0]=ct/aspect;e[1]=0;e[2]=0;e[3]=0; e[4]=0;e[5]=ct;e[6]=0;e[7]=0; e[8]=0;e[9]=0;e[10]=-(far+near)*rd;e[11]=-1; e[12]=0;e[13]=0;e[14]=-2*near*far*rd;e[15]=0;
        return this;
    }
    perspective(fovy,aspect,near,far) { return this.concat(new Matrix4().setPerspective(fovy,aspect,near,far)); }
    setScale(x,y,z) { var e=this.elements; e[0]=x;e[4]=0;e[8]=0;e[12]=0; e[1]=0;e[5]=y;e[9]=0;e[13]=0; e[2]=0;e[6]=0;e[10]=z;e[14]=0; e[3]=0;e[7]=0;e[11]=0;e[15]=1; return this; }
    scale(x,y,z) { var e=this.elements; e[0]*=x;e[4]*=y;e[8]*=z; e[1]*=x;e[5]*=y;e[9]*=z; e[2]*=x;e[6]*=y;e[10]*=z; e[3]*=x;e[7]*=y;e[11]*=z; return this; }
    setTranslate(x,y,z) { var e=this.elements; e[0]=1;e[4]=0;e[8]=0;e[12]=x; e[1]=0;e[5]=1;e[9]=0;e[13]=y; e[2]=0;e[6]=0;e[10]=1;e[14]=z; e[3]=0;e[7]=0;e[11]=0;e[15]=1; return this; }
    translate(x,y,z) { var e=this.elements; e[12]+=e[0]*x+e[4]*y+e[8]*z; e[13]+=e[1]*x+e[5]*y+e[9]*z; e[14]+=e[2]*x+e[6]*y+e[10]*z; e[15]+=e[3]*x+e[7]*y+e[11]*z; return this; }
    setRotate(angle,x,y,z) {
        var e=this.elements,s,c,len,rlen,nc,xy,yz,zx,xs,ys,zs;
        angle=Math.PI*angle/180; s=Math.sin(angle); c=Math.cos(angle);
        if(0!==x&&0===y&&0===z){if(x<0)s=-s; e[0]=1;e[4]=0;e[8]=0;e[12]=0; e[1]=0;e[5]=c;e[9]=-s;e[13]=0; e[2]=0;e[6]=s;e[10]=c;e[14]=0; e[3]=0;e[7]=0;e[11]=0;e[15]=1;}
        else if(0===x&&0!==y&&0===z){if(y<0)s=-s; e[0]=c;e[4]=0;e[8]=s;e[12]=0; e[1]=0;e[5]=1;e[9]=0;e[13]=0; e[2]=-s;e[6]=0;e[10]=c;e[14]=0; e[3]=0;e[7]=0;e[11]=0;e[15]=1;}
        else if(0===x&&0===y&&0!==z){if(z<0)s=-s; e[0]=c;e[4]=-s;e[8]=0;e[12]=0; e[1]=s;e[5]=c;e[9]=0;e[13]=0; e[2]=0;e[6]=0;e[10]=1;e[14]=0; e[3]=0;e[7]=0;e[11]=0;e[15]=1;}
        else{len=Math.sqrt(x*x+y*y+z*z); if(len!==1){rlen=1/len;x*=rlen;y*=rlen;z*=rlen;} nc=1-c;xy=x*y;yz=y*z;zx=z*x;xs=x*s;ys=y*s;zs=z*s; e[0]=x*x*nc+c;e[1]=xy*nc+zs;e[2]=zx*nc-ys;e[3]=0; e[4]=xy*nc-zs;e[5]=y*y*nc+c;e[6]=yz*nc+xs;e[7]=0; e[8]=zx*nc+ys;e[9]=yz*nc-xs;e[10]=z*z*nc+c;e[11]=0; e[12]=0;e[13]=0;e[14]=0;e[15]=1;}
        return this;
    }
    rotate = function(angle,x,y,z) { return this.concat(new Matrix4().setRotate(angle,x,y,z)); }
    setLookAt(ex,ey,ez,cx,cy,cz,ux,uy,uz) {
        var e,fx,fy,fz,rlf,sx,sy,sz,rls,upx,upy,upz;
        fx=cx-ex;fy=cy-ey;fz=cz-ez; rlf=1/Math.sqrt(fx*fx+fy*fy+fz*fz); fx*=rlf;fy*=rlf;fz*=rlf;
        sx=fy*uz-fz*uy;sy=fz*ux-fx*uz;sz=fx*uy-fy*ux; rls=1/Math.sqrt(sx*sx+sy*sy+sz*sz); sx*=rls;sy*=rls;sz*=rls;
        upx=sy*fz-sz*fy;upy=sz*fx-sx*fz;upz=sx*fy-sy*fx;
        e=this.elements; e[0]=sx;e[1]=upx;e[2]=-fx;e[3]=0; e[4]=sy;e[5]=upy;e[6]=-fy;e[7]=0; e[8]=sz;e[9]=upz;e[10]=-fz;e[11]=0; e[12]=0;e[13]=0;e[14]=0;e[15]=1;
        return this.translate(-ex,-ey,-ez);
    }
    lookAt(ex,ey,ez,cx,cy,cz,ux,uy,uz) { return this.concat(new Matrix4().setLookAt(ex,ey,ez,cx,cy,cz,ux,uy,uz)); }
    dropShadow(plane,light) { var mat=new Matrix4(),e=mat.elements,dot=plane[0]*light[0]+plane[1]*light[1]+plane[2]*light[2]+plane[3]*light[3]; e[0]=dot-light[0]*plane[0];e[1]=-light[1]*plane[0];e[2]=-light[2]*plane[0];e[3]=-light[3]*plane[0]; e[4]=-light[0]*plane[1];e[5]=dot-light[1]*plane[1];e[6]=-light[2]*plane[1];e[7]=-light[3]*plane[1]; e[8]=-light[0]*plane[2];e[9]=-light[1]*plane[2];e[10]=dot-light[2]*plane[2];e[11]=-light[3]*plane[2]; e[12]=-light[0]*plane[3];e[13]=-light[1]*plane[3];e[14]=-light[2]*plane[3];e[15]=dot-light[3]*plane[3]; return this.concat(mat); }
    dropShadowDirectionally = function(nx,ny,nz,px,py,pz,lx,ly,lz) { var a=px*nx+py*ny+pz*nz; return this.dropShadow([nx,ny,nz,-a],[lx,ly,lz,0]); }
}
